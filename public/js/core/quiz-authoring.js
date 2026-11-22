export function rotateQuizChoices(assessment, offset) {
  const { options, feedback, correct } = assessment;
  const rotate = values => values.slice(offset).concat(values.slice(0, offset));
  return {
    ...assessment,
    options: { en: rotate(options.en), he: rotate(options.he) },
    ...(feedback && { feedback: { en: rotate(feedback.en), he: rotate(feedback.he) } }),
    correct: (correct - offset + options.en.length) % options.en.length,
  };
}
