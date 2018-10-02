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
      return `${user} Milestones`;
    }
  },
  suggestedMilestoneTitle: {
    en: user => {
      return `${user} suggested milestone`;
    }
  },
  lastAPIDown: {
    en: "Last.fm API is unreachable right now, please try again later!"
  },
  unknownError: {
    en: "Something unpredictable happened, the developer has been notified."
  },
  telegramAlertMessage: (name, step, isSuggested, error) => {
    return `🎉 <b>New Milestone Search</b> \n\n<b>Username:</b> ${name} \n<b>Step:</b> ${step}\n<b>Options: </b>${
      isSuggested ? "suggested milestone" : "none"
    }<b>\nPermalink:</b> http://lastmilestones.tk/milestones?user=${name}&step=${step}\n\n<b>${
      !error ? "No errors</b>" : "Error:</b>\n" + error
    }`;
  },
  signUpSuccess: { en: "You've been successfully signed up!" },
  signUpError: { en: "There was an error signing you up!" },
  alreadyExists: { en: field => `${field} already exists!` },
  loginError: { en: "Either the email or password is incorrect!" },
  loginSuccess: { en: username => `Welcome back, ${username}!` }
};
