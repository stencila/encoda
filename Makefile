all: setup lint cover docs

setup:
	npm install

lint:
	npm run lint

test:
	npm test

test-diffs:
	npm run test-diffs

cover:
	npm run cover

docs:
	npm run docs
.PHONY: docs

clean:
	npm run clean
