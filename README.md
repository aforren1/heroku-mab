1. Make directory
2. `cd <directory>`
3. `git init`
4. `heroku login`
5. `heroku create mabactlab`
6. `heroku features:enable http-session-affinity`

- (if we use multiple dynos, check multiple nodes instructions at https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io)

7. A few config vars need to be set in Heroku (& in a local .env file?)

- SUCCESS_URL: Where to redirect upon completion
- GOOGLE_DRIVE_JSON: JSON string containing Google service account creds
- MAILGUN_API_KEY: key for sending emails
- MAILGUN_DOMAIN: domain for sending emails
