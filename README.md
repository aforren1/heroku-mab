1. Make directory
2. `cd <directory>`
3. `git init`
4. `heroku login`
5. `heroku create mabactlab`
6. `heroku features:enable http-session-affinity`

- (if we use multiple dynos, check multiple nodes instructions at https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io)

7. A few config vars need to be set in Heroku (& in a local .env file?)

- SUCCESS_URL: Where to redirect upon completion
- GOOGLE_DRIVE_JSON: JSON string containing Google service account creds (NB: run through JSON.stringify)
- MAILGUN_API_KEY: key for sending emails
- MAILGUN_DOMAIN: domain for sending emails

Local test via `npm run build && heroku local`

URL:

Original: https://mabactlab.herokuapp.com
scalar reward: https://mabactlab-scalar.herokuapp.com

example:

https://actlabyale.github.io/web-consent?dest=https://mabactlab-scalar.herokuapp.com/&PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}

(make another deployment for a separate branch, e.g. `heroku create mabactlab-scalar --remote scalar`)
https://devcenter.heroku.com/articles/multiple-environments
