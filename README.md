# Telegram export: team Bravo

This monorepo holds all our packages that are to be used in the deployment.


## Development approach

Since the scope of work requested was very large, we focused on simplicity and low infrastructure cost. 
Because of that, some functionalities are missing:

* Best practice usage
* Proper error handling
* Doc comments

However, we must reiterate it being a forced choice rather than the preference
of the development team.

## Core modules

There are several core modules:

* Telegram parser, which contains the functions for handling backfill jobs and regular jobs.
* Admin functions, which contain:
    * Channel read functionality in `read_channels`
    * Channel create and delete functionality in `handle_channel`
    * Backfill creation functionality in `schedule_backfill`
* Front-end

## Setup

0. Set up your GCP project, log in, do default application authorization - just follow Google Cloud docs.
1. For the cloud functions, it is a good practice to create your own `deploy.sh` scripts which deploy
the functions with the specified CPU, memory limits, concurrency, etc.
2. For the functions that should be callable publicly with authorization, grant invoke role to members
who would like to invoke this function.
3. Create Cloud Run services running the back-end and the front-end parts. Make sure to provide
the correct secrets to each service.
4. Log in onto the front-end and perform the jobs.


