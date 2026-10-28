function normalizeFillBlank(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function gradeAuto(question, userAnswer) {
  const { type, correctAnswer, acceptedAnswers, marks } = question;

  if (type === 'mcq') {
    const isCorrect =
      userAnswer != null && String(userAnswer) === String(correctAnswer);
    return { isCorrect, awardedMarks: isCorrect ? marks : 0, gradingStatus: 'auto_graded' };
  }

  if (type === 'true_false') {
    const ua = userAnswer === true || userAnswer === 'true' || userAnswer === 'True';
    const ca = correctAnswer === true || correctAnswer === 'true';
    const isCorrect = ua === ca;
    return { isCorrect, awardedMarks: isCorrect ? marks : 0, gradingStatus: 'auto_graded' };
  }

  if (type === 'fill_blank') {
    const ua = normalizeFillBlank(userAnswer);
    if (!ua) return { isCorrect: false, awardedMarks: 0, gradingStatus: 'auto_graded' };
    const candidates = [correctAnswer, ...(acceptedAnswers || [])]
      .filter((v) => v != null)
      .map(normalizeFillBlank);
    const isCorrect = candidates.includes(ua);
    return { isCorrect, awardedMarks: isCorrect ? marks : 0, gradingStatus: 'auto_graded' };
  }

  // short_answer, long_answer, programming
  return {
    isCorrect: undefined,
    awardedMarks: 0,
    gradingStatus: 'pending_review',
  };
}

module.exports = { gradeAuto, normalizeFillBlank };