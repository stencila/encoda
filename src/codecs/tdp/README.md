# TDP: Tabular Data Package

The [TDP specification](https://specs.frictionlessdata.io/tabular-data-package/)
is a [Data Package](https://specs.frictionlessdata.io/data-package/) (represented by a
`datapackage.json` file) that has:

- at least one resource in the resources array
- each resource must be a (Tabular Data Resource)[https://specs.frictionlessdata.io/tabular-data-resource/](TDR)

The TDR can be either:

- inline "JSON tabular data" that is array of data rows where each row is an array or object"
- a CSV file
