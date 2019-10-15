# XML codec

The `xml` codec provides an alternative to the other document interchange formats such as `json` and `yaml`. It is used within Encoda to embed a document within the XML metadata of PDF documents.

The `xml` codec encodes document nodes as XML elements with tag names equal to the node type name and a `key` attribute where necessary e.g.

```xml
<person>
  <array key="givenNames">
    <string>Jim</string>
    <string>Jake</string>
  </array>
  <array key="familyNames">
    <string>Jones</string>
  </array>
</person>
````
