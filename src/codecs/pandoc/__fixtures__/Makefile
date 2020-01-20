all: $(patsubst %.md,%.pandoc.json,$(filter-out README.md,$(wildcard *.md)))

%.pandoc.json: %.md FORCE
	./pandoc-json.sh $< > $@

FORCE:
