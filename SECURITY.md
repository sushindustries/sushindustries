# Security policy

## Supported versions

There are no versions. This repository deploys from `main` and the packages
publish from it; the latest commit is the only thing that is ever running or
installable, and the only thing that gets fixes.

## Reporting a vulnerability

Use GitHub's private reporting: **Security → Report a vulnerability** on this
repository. That reaches me without making the report public.

Please do not open a public issue for anything you believe is exploitable -
an issue is public the moment it exists, which turns your report into a
disclosure.

What to expect: I am one person, not a security team. I read reports within a
few days, say what I think within a week, and if the report is right, the fix
deploys the way everything here deploys - a commit to `main`. Credit in the
commit message is yours if you want it, anonymity if you prefer.

In scope: this repository's code and the site it deploys (adamjurek.com).
Out of scope: the platforms it stands on (Railway, GitHub, PostHog, Groq) -
report those to their own programs - and anything that requires my accounts
rather than my code.
