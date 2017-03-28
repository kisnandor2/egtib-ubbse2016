#!/bin/bash

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	docker login -u="$DOCKER_USERNAME" -p="$api_key" registry.heroku.com
	docker build -t registry.heroku.com/egtib/web .
	docker push registry.heroku.com/egtib/web
	exit 0
fi

echo "Not on master branch, no deploy needed"