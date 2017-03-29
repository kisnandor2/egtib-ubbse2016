#!/bin/bash

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	npm run test_e2e
	exit 0
fi

if [ "$TRAVIS_BRANCH" = "dev" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	npm run test_e2e
	exit 0
fi

echo "Not on master/dev branch, no E2E test needed!"