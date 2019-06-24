# `gdoc`

A codec for Google Documents (GDoc).

This codec decodes from, and encodes to, the GDoc JSON ('application/vnd.google-apps.document')
as defined as [JSON Schemas here](https://docs.googleapis.com/$discovery/rest?version=v1) and in
[Typescript here](https://github.com/googleapis/google-api-nodejs-client/blob/master/src/apis/docs/v1.ts)

See also the [guide on the structure](https://developers.google.com/docs/api/concepts/structure)
of a GDoc.

It is possible to get this JSON using the Google Docs API [`get`](https://developers.google.com/docs/api/reference/rest/v1/documents/get) method.
However, it is not possible to `POST` i.e. upload the JSON. The [`create`](https://developers.google.com/docs/api/reference/rest/v1/documents/create) method
only creates a\*blank\*\* document:

> Creates a blank document using the title given in the request.
> Other fields in the request,\*including any provided content, are ignored\*\*.

There are two other possibilities for creating a GDoc from content:

1. Use the Google Drive API [`import` method](https://developers.google.com/drive/api/v3/manage-uploads#import_to_google_docs_types_) to upload content such as HTML.
2. Use Google [App Script API](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/google-apps-script/google-apps-script.document.d.ts)
   to walk Stencila JSON and build up the GDoc by calling methods such as `Body.appendParagraph` etc.
