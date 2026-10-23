export const scenarios = [{
  id: 'scope_negotiation',
  title: 'Negotiate a Friday release',
  category: 'Workplace communication',
  role: 'Software project manager',
  character: 'Alex',
  characterRole: 'Business stakeholder',
  brief: 'Your stakeholder wants additional features before Friday. Clarify their needs and negotiate a realistic release plan.',
  opening: 'We need analytics and CSV export added before Friday. Can your team commit to both?',
  facts: [
    ['Deadline', 'Friday'],
    ['Team capacity', '5 points'],
    ['Core workflow', '5 points · committed'],
    ['Analytics dashboard', '3 points'],
    ['CSV export', '2 points'],
  ],
  goals: ['Clarify business priorities', 'Identify capacity constraints', 'Propose feasible trade-offs', 'Confirm an agreed plan'],
}];
