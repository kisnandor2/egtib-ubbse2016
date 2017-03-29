#!/bin/bash

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	npm start & ServerPID=$! #start the server and save its PID
	npm run test_e2e
	kill $ServerPID #kill the server after test
	exit 0
fi

if [ "$TRAVIS_BRANCH" = "dev" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	npm start & ServerPID=$! #start the server and save its PID
	npm run test_e2e
	kill $ServerPID #kill the server after test
	exit 0
fi

echo "Not on master/dev branch, no E2E test needed!"