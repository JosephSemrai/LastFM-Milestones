module.exports = {
  nameLength: {
    en: "Name should be at least 1 character long!"
  },
  stepErr: {
    en: "Step cannot be less than 100!"
  },
  longProcess: {
    en: "The result is too long to process, please increase the step!"
  },
  stepBiggerThanPlaycount: {
    en: step => {
      return `Selected step, ${step}, is bigger than your number of scrobbles! Please decrease the step to see the results!`;
    }
  },
  milestoneTitle: {
      en: user => {
          return `${user} Milestones`
      }
  },
  suggestedMilestoneTitle: {
      en: user => {
          return `${user} suggested milestone`
      }
  },
  lastAPIDown: {
      en: "Last.fm API is unreachable, please try again later!"
  }
};
