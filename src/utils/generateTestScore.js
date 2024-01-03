/*
---- Utility function to generate sscore for a section or chapter test
*/
const generateTestScore = (test, answers) => {
  let numberOfCorrects = 0;
  test.forEach((question, index) => {
    if (question.correctAnswer === answers[index]) numberOfCorrects += 1;
  });

  return numberOfCorrects;
};

export default generateTestScore;
