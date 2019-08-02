A collection of CSL-JSON test fixtures.

These were downloaded using `httpie` using commands like:

```bash
http doi.org/10.5334/jors.182 Accept:"application/vnd.citationstyles.csl+json" --follow | jq . >  10.5334-jors-182.csl.json
```
