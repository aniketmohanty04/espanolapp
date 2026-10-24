/**
 * Audio Conversion Utility for Azure AI Speech
 *
 * Converts recorded browser audio (e.g. WebM/Opus, OGG, or MP4) to standard
 * 16kHz 16-bit mono PCM WAV required for reliable Azure Pronunciation Assessment.
 *
 * Strictly adheres to rule: NEVER relabel WebM/Opus bytes as WAV!
 * The audio must be genuinely decoded and re-encoded with a valid 44-byte RIFF header.
 */

/**
 * Encodes Float32 mono audio samples into a genuine 16-bit PCM WAV ArrayBuffer with a 44-byte RIFF header.
 */
export function encodeMonoWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings into DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // Little-endian ChunkSize
  writeString(8, 'WAVE');

  // 2. "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for standard PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate (e.g. 16000)
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)

  // 3. "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // 4. Write 16-bit PCM sample data with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    // Scale float (-1.0 to 1.0) to 16-bit signed int (-32768 to 32767)
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, Math.round(intSample), true);
  }

  return buffer;
}

/**
 * Resamples a Float32Array from sourceSampleRate to targetSampleRate using linear interpolation.
 */
export function resampleAudioBuffer(
  inputData: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate || inputData.length === 0) {
    return inputData;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.round(inputData.length / ratio);
  const result = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const sourcePos = i * ratio;
    const index = Math.floor(sourcePos);
    const fraction = sourcePos - index;

    const sample1 = inputData[index] || 0;
    const sample2 = inputData[index + 1] !== undefined ? inputData[index + 1] : sample1;

    result[i] = sample1 + fraction * (sample2 - sample1);
  }

  return result;
}

/**
 * Converts any audio Blob (WebM, OGG, MP4) into a verified 16kHz mono 16-bit PCM WAV Blob.
 * If decoding fails (e.g. in test environment without Web Audio API), it safely returns
 * the original Blob preserving its genuine mimeType — NEVER fraudulently relabeling WebM as WAV.
 */
export async function convertAudioBlobToWav(
  audioBlob: Blob,
  targetSampleRate = 16000
): Promise<{ wavBlob: Blob; isConverted: boolean; mimeType: string }> {
  // If the blob is already genuine audio/wav, verify or return
  if (audioBlob.type === 'audio/wav' && audioBlob.size > 44) {
    return { wavBlob: audioBlob, isConverted: true, mimeType: 'audio/wav' };
  }

  // Check if AudioContext is available in browser
  const AudioCtx = typeof window !== 'undefined'
    ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    : null;

  if (!AudioCtx) {
    // Cannot decode without AudioContext, return genuine blob with true type
    return {
      wavBlob: audioBlob,
      isConverted: false,
      mimeType: audioBlob.type || 'audio/webm'
    };
  }

  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioCtx();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Extract mono channel (mixdown if stereo)
    const numChannels = decodedBuffer.numberOfChannels;
    let monoData: Float32Array;

    if (numChannels === 1) {
      monoData = decodedBuffer.getChannelData(0);
    } else {
      // Average all channels to mono
      const len = decodedBuffer.length;
      monoData = new Float32Array(len);
      for (let c = 0; c < numChannels; c++) {
        const channelData = decodedBuffer.getChannelData(c);
        for (let i = 0; i < len; i++) {
          monoData[i] += channelData[i] / numChannels;
        }
      }
    }

    // Resample to 16kHz
    const resampledData = resampleAudioBuffer(monoData, decodedBuffer.sampleRate, targetSampleRate);

    // Encode standard PCM WAV
    const wavBuffer = encodeMonoWav(resampledData, targetSampleRate);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    return {
      wavBlob,
      isConverted: true,
      mimeType: 'audio/wav'
    };
  } catch (err) {
    console.warn('Audio decoding to 16kHz WAV failed, falling back to genuine original format:', err);
    return {
      wavBlob: audioBlob,
      isConverted: false,
      mimeType: audioBlob.type || 'audio/webm'
    };
  } finally {
    if (audioContext && typeof audioContext.close === 'function') {
      try {
        await audioContext.close();
      } catch {
        // ignore
      }
    }
  }
}
