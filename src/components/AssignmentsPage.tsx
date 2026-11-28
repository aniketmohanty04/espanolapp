import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Lock,
  Send
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import {
  AssignmentItem,
  AssignmentSubmission,
  QuestionResult,
  getLocalAssignments,
  loadCloudAssignments,
  getStudentSubmissions,
  saveStudentSubmission,
  submitAssignmentToCloud
} from '../services/assignmentsService';

interface AssignmentsPageProps {
  onBackToHome: () => void;
}

const TYPE_LABELS: Record<string, { label: string; badge: string }> = {
  written: { label: 'Written (Escrito)', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  mcq: { label: 'MCQ (Opción Múltiple)', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  fill: { label: 'Fill in the Blank (Completar)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  'surprise-test': { label: 'Surprise Test (Examen Sorpresa)', badge: 'bg-rose-50 text-rose-800 border-rose-200' }
};

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ onBackToHome }) => {
  const { currentUserEmail, progress } = useGame();
  const userKey = currentUserEmail || 'guest';
  const studentDisplayName = progress?.profile?.displayName || currentUserEmail || 'Guest Student';

  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => getLocalAssignments());
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>(() =>
    getStudentSubmissions(userKey)
  );
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    void loadCloudAssignments().then(setAssignments);

    const onUpdated = () => setAssignments(getLocalAssignments());
    const onFocus = () => void loadCloudAssignments().then(setAssignments);
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      if (document.visibilityState !== 'hidden') {
        void loadCloudAssignments().then(setAssignments);
      }
    }, 30_000);

    window.addEventListener('aventura-assignments-updated', onUpdated);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('aventura-assignments-updated', onUpdated);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId) || null;

  const getStatus = (item: AssignmentItem): 'upcoming' | 'open' | 'closed' => {
    const start = item.startDate ? new Date(item.startDate).getTime() : 0;
    const end = item.deadline ? new Date(item.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    if (Number.isFinite(start) && nowMs < start) return 'upcoming';
    if (Number.isFinite(end) && nowMs > end) return 'closed';
    return 'open';
  };

  const handleOpenAssignment = (item: AssignmentItem) => {
    setActiveAssignmentId(item.id);
    const existing = submissions[item.id];
    setDraftAnswers(existing ? { ...existing.answers } : {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;

    let autoScore = 0;
    let autoTotal = 0;
    const questionResults: Record<string, QuestionResult> = {};

    for (const q of activeAssignment.questions) {
      const rawAnswer = draftAnswers[q.id] || '';
      if ((q.type === 'mcq' || q.type === 'fill') && q.correctAnswer) {
        autoTotal += 1;
        const given = rawAnswer.trim().toLowerCase();
        const expected = q.correctAnswer.trim().toLowerCase();
        const isCorrect = Boolean(given && given === expected);
        if (isCorrect) {
          autoScore += 1;
        }
        questionResults[q.id] = {
          answer: rawAnswer,
          isCorrect,
          expectedAnswer: q.correctAnswer
        };
      } else {
        questionResults[q.id] = {
          answer: rawAnswer,
          isCorrect: null
        };
      }
    }

    const sub: AssignmentSubmission = {
      assignmentId: activeAssignment.id,
      studentEmail: currentUserEmail || 'guest',
      studentName: studentDisplayName,
      submittedAt: new Date().toISOString(),
      answers: { ...draftAnswers },
      questionResults,
      autoScore: autoTotal > 0 ? autoScore : undefined,
      autoTotal: autoTotal > 0 ? autoTotal : undefined
    };

    saveStudentSubmission(userKey, sub);
    setSubmissions(prev => ({ ...prev, [activeAssignment.id]: sub }));
    void submitAssignmentToCloud(sub);
  };

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={activeAssignment ? () => setActiveAssignmentId(null) : onBackToHome}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-sm font-bold border border-[#E0D5C7] shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#E05615]" />
          <span>{activeAssignment ? 'Back to All Assignments' : 'Back to Home'}</span>
        </button>

        <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#EADFCF] text-xs font-black text-[#B45309] shadow-xs">
          Assignments &amp; Worksheets (Tareas)
        </span>
      </div>

      {/* Header Banner */}
      {!activeAssignment && (
        <>
          <div className="rounded-3xl bg-white border-2 border-[#EADFCF] p-6 sm:p-8 shadow-sm">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E05615]/10 border border-[#E05615]/25 text-[#C2410C] text-xs font-black mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Coursework &amp; Surprise Tests</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#24140E]">
              Assignments &amp; Worksheets (Tareas)
            </h1>
            <p className="text-sm text-[#6B584D] mt-2 font-medium max-w-2xl">
              Complete written exercises, multiple-choice quizzes, fill-in-the-blank worksheets, and surprise tests assigned by your instructor before their deadline.
            </p>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-3xl bg-white border-2 border-dashed border-[#E0D5C7] p-10 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#E05615] mx-auto opacity-80" />
              <h3 className="font-serif font-black text-lg text-[#24140E]">
                No Assignments Posted Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6B60] max-w-md mx-auto">
                When your instructor adds a worksheet or surprise test from the Admin Portal, it will appear here automatically with its start date and deadline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map(item => {
                const status = getStatus(item);
                const sub = submissions[item.id];
                const meta = TYPE_LABELS[item.type] || TYPE_LABELS.written;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border-2 border-[#EADFCF] hover:border-[#E05615]/50 p-5 shadow-xs flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase ${meta.badge}`}>
                          {meta.label}
                        </span>
                        {sub ? (
                          <span className="text-[11px] font-black text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                        ) : status === 'upcoming' ? (
                          <span className="text-[11px] font-black text-amber-700 flex items-center space-x-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Upcoming</span>
                          </span>
                        ) : status === 'closed' ? (
                          <span className="text-[11px] font-black text-rose-700">Closed</span>
                        ) : (
                          <span className="text-[11px] font-black text-emerald-700">Open Now</span>
                        )}
                      </div>

                      <h3 className="font-serif font-black text-lg text-[#24140E]">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[#6B584D] leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-2 space-y-1 text-[11px] text-[#7A6B60] font-semibold">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#E05615]" />
                          <span>Starts: {formatDateTime(item.startDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Deadline: {formatDateTime(item.deadline)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7A6B60]">
                        {item.questions.length} question{item.questions.length === 1 ? '' : 's'}
                      </span>

                      <button
                        onClick={() => handleOpenAssignment(item)}
                        disabled={status === 'upcoming'}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          status === 'upcoming'
                            ? 'bg-[#EFE6D9] text-[#8C7A6B] cursor-not-allowed'
                            : sub
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer'
                            : status === 'closed'
                            ? 'bg-stone-200 text-stone-600 cursor-pointer'
                            : 'bg-[#E05615] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer'
                        }`}
                      >
                        {status === 'upcoming'
                          ? 'Locked Until Start'
                          : sub
                          ? 'View Submission'
                          : status === 'closed'
                          ? 'Closed'
                          : 'Start Worksheet'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Active Assignment / Worksheet View */}
      {activeAssignment && (
        <div className="rounded-3xl bg-white border-2 border-[#EADFCF] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-[#F2ECE1] pb-4 space-y-2">
            <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase ${(TYPE_LABELS[activeAssignment.type] || TYPE_LABELS.written).badge}`}>
              {(TYPE_LABELS[activeAssignment.type] || TYPE_LABELS.written).label}
            </span>
            <h2 className="text-2xl font-black font-serif text-[#24140E]">
              {activeAssignment.title}
            </h2>
            {activeAssignment.description && (
              <p className="text-sm text-[#6B584D]">{activeAssignment.description}</p>
            )}
            <p className="text-xs text-[#7A6B60] font-semibold">
              Deadline: {formatDateTime(activeAssignment.deadline)}
            </p>
          </div>

          {submissions[activeAssignment.id] && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
              <span>✓ Submitted on {formatDateTime(submissions[activeAssignment.id].submittedAt)}</span>
              {submissions[activeAssignment.id].autoTotal !== undefined && (
                <span>
                  Auto-Graded Score: {submissions[activeAssignment.id].autoScore} / {submissions[activeAssignment.id].autoTotal}
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeAssignment.questions.map((q, idx) => {
              const currentSub = submissions[activeAssignment.id];
              const isLocked = getStatus(activeAssignment) === 'closed' || Boolean(currentSub);
              const qResult = currentSub?.questionResults?.[q.id];
              const isAutoGraded = Boolean(currentSub && (q.type === 'mcq' || q.type === 'fill') && q.correctAnswer);
              const givenVal = (currentSub?.answers?.[q.id] ?? draftAnswers[q.id] ?? '').trim();
              const isCorrect = qResult
                ? qResult.isCorrect
                : isAutoGraded
                  ? Boolean(givenVal && givenVal.toLowerCase() === (q.correctAnswer || '').trim().toLowerCase())
                  : null;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isCorrect === true
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : isCorrect === false
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-[#FAF7F2] border-[#E0D5C7]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[#24140E]">
                      {idx + 1}. {q.prompt}
                    </p>
                    {currentSub && isCorrect === true && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    )}
                    {currentSub && isCorrect === false && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-black">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong</span>
                      </span>
                    )}
                  </div>

                  {q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = draftAnswers[q.id] === opt;
                        const isExpectedOpt = Boolean(
                          currentSub &&
                          q.correctAnswer &&
                          opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                        );
                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center justify-between space-x-2.5 p-2.5 rounded-xl border text-xs font-semibold ${
                              isLocked ? 'cursor-default' : 'cursor-pointer'
                            } ${
                              currentSub && isExpectedOpt
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                : currentSub && isSelected && isCorrect === false
                                  ? 'bg-rose-50 border-rose-400 text-rose-900'
                                  : isSelected
                                    ? 'bg-white border-[#E05615] text-[#24140E]'
                                    : 'bg-white/70 border-[#E0D5C7] text-[#4A3B32]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name={`asg_q_${q.id}`}
                                disabled={isLocked}
                                checked={isSelected}
                                onChange={() => setDraftAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              />
                              <span>{opt}</span>
                            </div>
                            {currentSub && isExpectedOpt && (
                              <span className="text-[10px] font-black text-emerald-700">✓ Right Answer</span>
                            )}
                            {currentSub && isSelected && isCorrect === false && (
                              <span className="text-[10px] font-black text-rose-700">✗ Your Choice</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ) : q.type === 'fill' ? (
                    <input
                      type="text"
                      disabled={isLocked}
                      value={draftAnswers[q.id] || ''}
                      onChange={e => setDraftAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B5] bg-white text-sm"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      disabled={isLocked}
                      value={draftAnswers[q.id] || ''}
                      onChange={e => setDraftAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Write your response..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B5] bg-white text-sm"
                    />
                  )}

                  {currentSub && isCorrect === false && q.correctAnswer && (
                    <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      Correct Answer: <span className="underline">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              );
            })}

            {!submissions[activeAssignment.id] && getStatus(activeAssignment) === 'open' && (
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#E05615] hover:bg-[#C2410C] text-white font-black text-sm shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Assignment</span>
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
