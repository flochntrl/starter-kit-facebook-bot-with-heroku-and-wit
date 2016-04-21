# FACEBOOK BOT MESSENGER WITH WIT.AI

# Installation

- Create an app on heroku

- Install Heroku Toolbelt ( If you haven't already )

- Then Log in

```
$ heroku login
```

- Create a new Git repository (if not exist)

```
$ cd my-project/
$ git init
$ heroku git:remote -a your-heroku-app
```

- Deploy your application

```
$ git add .
$ git commit -am "make it better"
$ git push heroku master
```

- Existing repo

```
$ heroku git:remote -a your-heroku-app
```

- Create Env Var in Heroku :
  
    - WIT_TOKEN
    - FB_PAGE_ID
    - FB_PAGE_TOKEN 
    - APP_SECRET_PROOF

# Talk to your bot on Messenger!