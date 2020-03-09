<!--
A XSLT styesheet for transforming MathML to Tex.

This concatenates, and slighlty modifies the
files from https://github.com/oerpub/mathconverter/tree/master/xsl_yarosh.
That is, the `<xsl:include/>` elements, have bee replaced with the
contents of the included file.

____________________________________________

README for the XSLT MathML Library 2.1.2

XSLT MathML Library is a set of XSLT stylesheets to transform
MathML 2.0 to LaTeX.

For more information, see
http://www.raleigh.ru/MathML/mmltex/index.php?lang=en

# Manifest

README        this file
mmltex.xsl
tokens.xsl
glayout.xsl
scripts.xsl
tables.xsl
entities.xsl
cmarkup.xsl

# Use

There are two ways of using the library:

    * Use a local copy of the library.

        1. Download the distribution (see below).

        2. Unpack the distribution, using unzip.

        3. In your stylesheet import or include either the main
           stylesheet, mmltex.xsl, or the stylesheet module you
           wish to use, such as tokens.xsl. This example assumes
           that the distribution has been extracted into the same
           directory as your own stylesheet:

           <xsl:import href="mmltex.xsl"/>

    * Import or include either the main stylesheet, or the
      stylesheet module you wish to use, directly from the library
      website; http://www.raleigh.ru/MathML/mmltex/. For example:

      <xsl:import href="http://www.raleigh.ru/MathML/mmltex/mmltex.xsl"/>

# Obtaining The Library

The XSLT MathML Library is available for download as:

    * Zip file: http://www.raleigh.ru/MathML/mmltex/xsltml_2.1.2.zip

# Copyright

Copyright (C) 2001-2003 Vasil Yaroshevich

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the ``Software''), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

Except as contained in this notice, the names of individuals
credited with contribution to this software shall not be used in
advertising or otherwise to promote the sale, use or other
dealings in this Software without prior written authorization
from the individuals in question.

Any stylesheet derived from this Software that is publically
distributed will be identified with a different name and the
version strings in any derived Software will be changed so that
no possibility of confusion between the derived package and this
Software will exist.

# Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT.  IN NO EVENT SHALL NORMAN WALSH OR ANY OTHER
CONTRIBUTOR BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

# Contacting the Author

These stylesheets are maintained by Vasil Yaroshevich, <yarosh@raleigh.ru>.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:m="http://www.w3.org/1998/Math/MathML" version="1.0">

<xsl:output method="text" indent="no" encoding="UTF-8"/>

<!-- ====================================================================== -->
<!-- $Id: mmltex.xsl,v 1.7 2003/06/10 12:24:04 shade33 Exp $
     This file is part of the XSLT MathML Library distribution.
     See ./README or http://www.raleigh.ru/MathML/mmltex for
     copyright and other information                                        -->
<!-- ====================================================================== -->

<xsl:template match="m:mi|m:mn|m:mo|m:mtext|m:ms">
	<xsl:call-template name="CommonTokenAtr"/>
</xsl:template><xsl:template match="m:mglyph">
	<xsl:text>\textcolor{red}{</xsl:text>
	<xsl:value-of select="@alt"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template name="mi">
	<xsl:choose>
		<xsl:when test="string-length(normalize-space(.))&gt;1 and not(@mathvariant)">
			<xsl:text>\mathrm{</xsl:text>
				<xsl:apply-templates/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="mn">
	<xsl:choose>
		<xsl:when test="string(number(.))='NaN' and not(@mathvariant)">
			<xsl:text>\mathrm{</xsl:text>
				<xsl:apply-templates/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="mo">
<xsl:if test="translate(normalize-space(.),'()[]}|','{{{{{{')='{'">
		<xsl:choose>
	<xsl:when test="not(@stretchy='false') and count(preceding-sibling::m:mo[translate(normalize-space(.),'()[]}|','{{{{{{')='{'])mod 2=0 and following-sibling::m:mo[1][not(@stretchy='false')][translate(normalize-space(.),'()[]}|','{{{{{{')='{']">
			<xsl:text>\left</xsl:text>
		</xsl:when>
		<xsl:when test="not(@stretchy='false') and count(preceding-sibling::m:mo[translate(normalize-space(.),'()[]}|','{{{{{{')='{'])mod 2=1 and preceding-sibling::m:mo[1][not(@stretchy='false')][translate(normalize-space(.),'()[]}|','{{{{{{')='{']">
			<xsl:text>\right</xsl:text>
		</xsl:when>
	</xsl:choose>
</xsl:if>
<xsl:apply-templates/>
</xsl:template><xsl:template name="mtext">
	<xsl:variable name="content">
		<xsl:call-template name="replaceMtextEntities">
			<xsl:with-param name="content" select="normalize-space(.)"/>
		</xsl:call-template>
	</xsl:variable>
	<xsl:text>\text{</xsl:text>
	<xsl:value-of select="$content"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:mspace">
	<xsl:text>\phantom{\rule</xsl:text>
	<xsl:if test="@depth">
		<xsl:text>[-</xsl:text>
		<xsl:value-of select="@depth"/>
		<xsl:text>]</xsl:text>
	</xsl:if>
	<xsl:text>{</xsl:text>
	<xsl:if test="not(@width)">
		<xsl:text>0ex</xsl:text>
	</xsl:if>
	<xsl:value-of select="@width"/>
	<xsl:text>}{</xsl:text>
	<xsl:if test="not(@height)">
		<xsl:text>0ex</xsl:text>
	</xsl:if>
	<xsl:value-of select="@height"/>
	<xsl:text>}}</xsl:text>
</xsl:template><xsl:template name="ms">
	<xsl:choose>
		<xsl:when test="@lquote"><xsl:value-of select="@lquote"/></xsl:when>
		<xsl:otherwise><xsl:text>''</xsl:text></xsl:otherwise>
	</xsl:choose><xsl:apply-templates/><xsl:choose>
		<xsl:when test="@rquote"><xsl:value-of select="@rquote"/></xsl:when>
		<xsl:otherwise><xsl:text>''</xsl:text></xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="CommonTokenAtr">
	<xsl:if test="@mathbackground">
		<xsl:text>\colorbox[rgb]{</xsl:text>
		<xsl:call-template name="color">
			<xsl:with-param name="color" select="@mathbackground"/>
		</xsl:call-template>
		<xsl:text>}{$</xsl:text>
	</xsl:if>
	<xsl:if test="@color[not(@mathcolor)] or @mathcolor"> <!-- Note: @color is deprecated in MathML 2.0 -->
		<xsl:text>\textcolor[rgb]{</xsl:text>
		<xsl:call-template name="color">
			<xsl:with-param name="color" select="@color|@mathcolor"/>
		</xsl:call-template>
		<xsl:text>}{</xsl:text>
	</xsl:if>
	<xsl:if test="@mathvariant">
		<xsl:choose>
			<xsl:when test="@mathvariant='normal'">
				<xsl:text>\mathrm{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='bold'">
				<xsl:text>\mathbf{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='italic'">
				<xsl:text>\mathit{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='bold-italic'"> <!-- not supported -->
				<xsl:text>\mathit{</xsl:text>
				<xsl:message>The value bold-italic for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='double-struck'">	<!-- Required amsfonts -->
				<xsl:text>\mathbb{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='bold-fraktur'"> <!-- not supported -->
				<xsl:text>\mathfrak{</xsl:text>
				<xsl:message>The value bold-fraktur for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='script'">
				<xsl:text>\mathcal{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='bold-script'"> <!-- not supported -->
				<xsl:text>\mathcal{</xsl:text>
				<xsl:message>The value bold-script for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='fraktur'">	<!-- Required amsfonts -->
				<xsl:text>\mathfrak{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='sans-serif'">
				<xsl:text>\mathsf{</xsl:text>
			</xsl:when>
			<xsl:when test="@mathvariant='bold-sans-serif'"> <!-- not supported -->
				<xsl:text>\mathsf{</xsl:text>
				<xsl:message>The value bold-sans-serif for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='sans-serif-italic'"> <!-- not supported -->
				<xsl:text>\mathsf{</xsl:text>
				<xsl:message>The value sans-serif-italic for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='sans-serif-bold-italic'"> <!-- not supported -->
				<xsl:text>\mathsf{</xsl:text>
				<xsl:message>The value sans-serif-bold-italic for mathvariant is not supported</xsl:message>
			</xsl:when>
			<xsl:when test="@mathvariant='monospace'">
				<xsl:text>\mathtt{</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:text>{</xsl:text>
				<xsl:message>Error at mathvariant attribute</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:if>
	<xsl:call-template name="selectTemplate"/>
	<xsl:if test="@mathvariant">
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="@color or @mathcolor">
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="@mathbackground">
		<xsl:text>$}</xsl:text>
	</xsl:if>
</xsl:template><xsl:template name="selectTemplate">
	<xsl:choose>
		<xsl:when test="local-name(.)='mi'">
			<xsl:call-template name="mi"/>
		</xsl:when>
		<xsl:when test="local-name(.)='mn'">
			<xsl:call-template name="mn"/>
		</xsl:when>
		<xsl:when test="local-name(.)='mo'">
			<xsl:call-template name="mo"/>
		</xsl:when>
		<xsl:when test="local-name(.)='mtext'">
			<xsl:call-template name="mtext"/>
		</xsl:when>
		<xsl:when test="local-name(.)='ms'">
			<xsl:call-template name="ms"/>
		</xsl:when>
	</xsl:choose>
</xsl:template><xsl:template name="color">
<!-- NB: Variables colora and valueColor{n} only for Sablotron -->
	<xsl:param name="color"/>
	<xsl:variable name="colora" select="translate($color,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
	<xsl:choose>
	<xsl:when test="starts-with($colora,'#') and string-length($colora)=4">
		<xsl:variable name="valueColor">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,2,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="$valueColor div 15"/><xsl:text>,</xsl:text>
		<xsl:variable name="valueColor1">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,3,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="$valueColor1 div 15"/><xsl:text>,</xsl:text>
		<xsl:variable name="valueColor2">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,4,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="$valueColor2 div 15"/>
	</xsl:when>
	<xsl:when test="starts-with($colora,'#') and string-length($colora)=7">
		<xsl:variable name="valueColor1">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,2,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="valueColor2">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,3,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="($valueColor1*16 + $valueColor2) div 255"/><xsl:text>,</xsl:text>
		<xsl:variable name="valueColor1a">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,4,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="valueColor2a">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,5,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="($valueColor1a*16 + $valueColor2a) div 255"/><xsl:text>,</xsl:text>
		<xsl:variable name="valueColor1b">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,6,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="valueColor2b">
			<xsl:call-template name="Hex2Decimal">
				<xsl:with-param name="arg" select="substring($colora,7,1)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="($valueColor1b*16 + $valueColor2b) div 255"/>
	</xsl:when>
<!-- ======================= if color specifed as an html-color-name ========================================== -->
	<xsl:when test="$colora='aqua'"><xsl:text>0,1,1</xsl:text></xsl:when>
	<xsl:when test="$colora='black'"><xsl:text>0,0,0</xsl:text></xsl:when>
	<xsl:when test="$colora='blue'"><xsl:text>0,0,1</xsl:text></xsl:when>
	<xsl:when test="$colora='fuchsia'"><xsl:text>1,0,1</xsl:text></xsl:when>
	<xsl:when test="$colora='gray'"><xsl:text>.5,.5,.5</xsl:text></xsl:when>
	<xsl:when test="$colora='green'"><xsl:text>0,.5,0</xsl:text></xsl:when>
	<xsl:when test="$colora='lime'"><xsl:text>0,1,0</xsl:text></xsl:when>
	<xsl:when test="$colora='maroon'"><xsl:text>.5,0,0</xsl:text></xsl:when>
	<xsl:when test="$colora='navy'"><xsl:text>0,0,.5</xsl:text></xsl:when>
	<xsl:when test="$colora='olive'"><xsl:text>.5,.5,0</xsl:text></xsl:when>
	<xsl:when test="$colora='purple'"><xsl:text>.5,0,.5</xsl:text></xsl:when>
	<xsl:when test="$colora='red'"><xsl:text>1,0,0</xsl:text></xsl:when>
	<xsl:when test="$colora='silver'"><xsl:text>.75,.75,.75</xsl:text></xsl:when>
	<xsl:when test="$colora='teal'"><xsl:text>0,.5,.5</xsl:text></xsl:when>
	<xsl:when test="$colora='white'"><xsl:text>1,1,1</xsl:text></xsl:when>
	<xsl:when test="$colora='yellow'"><xsl:text>1,1,0</xsl:text></xsl:when>
	<xsl:otherwise>
		<xsl:message>Exception at color template</xsl:message>
	</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="Hex2Decimal">
	<xsl:param name="arg"/>
	<xsl:choose>
		<xsl:when test="$arg='f'">
			<xsl:value-of select="15"/>
		</xsl:when>
		<xsl:when test="$arg='e'">
			<xsl:value-of select="14"/>
		</xsl:when>
		<xsl:when test="$arg='d'">
			<xsl:value-of select="13"/>
		</xsl:when>
		<xsl:when test="$arg='c'">
			<xsl:value-of select="12"/>
		</xsl:when>
		<xsl:when test="$arg='b'">
			<xsl:value-of select="11"/>
		</xsl:when>
		<xsl:when test="$arg='a'">
			<xsl:value-of select="10"/>
		</xsl:when>
		<xsl:when test="translate($arg, '0123456789', '9999999999')='9'"> <!-- if $arg is number -->
			<xsl:value-of select="$arg"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:message>Exception at Hex2Decimal template</xsl:message>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:*/text()">
	<xsl:call-template name="replaceEntities">
		<xsl:with-param name="content" select="normalize-space()"/>
	</xsl:call-template>
</xsl:template>
<xsl:template match="m:mfrac">
	<xsl:choose>
		<xsl:when test="@linethickness">
			<xsl:text>\genfrac{}{}{</xsl:text>
			<xsl:choose>
				<xsl:when test="number(@linethickness)">
					<xsl:value-of select="@linethickness div 10"/>
					<xsl:text>ex</xsl:text>
				</xsl:when>
				<xsl:when test="@linethickness='0'">
					<xsl:text>0ex</xsl:text>
				</xsl:when>
				<xsl:when test="@linethickness='thin'">
					<xsl:text>.05ex</xsl:text>
				</xsl:when>
				<xsl:when test="@linethickness='medium'"/>
				<xsl:when test="@linethickness='thick'">
					<xsl:text>.2ex</xsl:text>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@linethickness"/>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:text>}{}{</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>\frac{</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:if test="@numalign='right'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:if test="@numalign='left'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:text>}{</xsl:text>
	<xsl:if test="@denomalign='right'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:apply-templates select="./*[2]"/>
		<xsl:if test="@denomalign='left'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:mfrac[@bevelled='true']">
	<xsl:text>\raisebox{1ex}{$</xsl:text>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:text>$}\!\left/ \!\raisebox{-1ex}{$</xsl:text>
	<xsl:apply-templates select="./*[2]"/>
	<xsl:text>$}\right.</xsl:text>
</xsl:template><xsl:template match="m:mroot">
	<xsl:choose>
		<xsl:when test="count(./*)=2">
			<xsl:text>\sqrt[</xsl:text>
			<xsl:apply-templates select="./*[2]"/>
			<xsl:text>]{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
		<!-- number of argumnets is not 2 - code 25 -->
			<xsl:message>exception 25:</xsl:message>
			<xsl:text>\text{exception 25:}</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:msqrt">
	<xsl:text>\sqrt{</xsl:text>
	<xsl:apply-templates/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:mfenced">
	<xsl:choose>
		<xsl:when test="@open">
			<xsl:if test="translate(@open,'{}[]()|','{{{{{{{')='{'">
				<xsl:text>\left</xsl:text>
			</xsl:if>
			<xsl:if test="@open='{' or @open='}'">
				<xsl:text>\</xsl:text>
			</xsl:if>
			<xsl:if test="translate(@open,'{}[]()|','{{{{{{{')!='{' and (translate(@close,'{}[]()|','{{{{{{{')='{' or not(@close))">
				<xsl:text>\left.</xsl:text>
			</xsl:if>
			<xsl:value-of select="@open"/>
		</xsl:when>
		<xsl:otherwise><xsl:text>\left(</xsl:text></xsl:otherwise>
	</xsl:choose>
			<xsl:variable name="sep">
				<xsl:choose>
					<xsl:when test="@separators">
						<xsl:value-of select="translate(@separators,' ','')"/>
					</xsl:when>
					<xsl:otherwise>,</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:for-each select="./*">
				<xsl:apply-templates select="."/>
				<xsl:if test="not(position()=last())">
					<xsl:choose>
						<xsl:when test="position()&gt;string-length($sep)">
							<xsl:value-of select="substring($sep,string-length($sep))"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="substring($sep,position(),1)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
			</xsl:for-each>
	<xsl:choose>
		<xsl:when test="@close">
			<xsl:if test="translate(@close,'{}[]()|','{{{{{{{')='{'">
				<xsl:text>\right</xsl:text>
			</xsl:if>
			<xsl:if test="@close='{' or @close='}'">
				<xsl:text>\</xsl:text>
			</xsl:if>
			<xsl:if test="translate(@close,'{}[]()|','{{{{{{{')!='{' and (translate(@open,'{}[]()|','{{{{{{{')='{' or not(@open))">
				<xsl:text>\right.</xsl:text>
			</xsl:if>
			<xsl:value-of select="@close"/>
		</xsl:when>
		<xsl:otherwise><xsl:text>\right)</xsl:text></xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:mphantom">
	<xsl:text>\phantom{</xsl:text>
	<xsl:apply-templates/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:menclose">
	<xsl:choose>
		<xsl:when test="@notation = 'actuarial'">
			<xsl:text>\overline{</xsl:text>
			<xsl:apply-templates/>
			<xsl:text>\hspace{.2em}|}</xsl:text>
		</xsl:when>
		<xsl:when test="@notation = 'radical'">
			<xsl:text>\sqrt{</xsl:text>
			<xsl:apply-templates/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>\overline{)</xsl:text>
			<xsl:apply-templates/>
			<xsl:text>}</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:mrow">
	<xsl:apply-templates/>
</xsl:template><xsl:template match="m:mstyle">
	<xsl:if test="@displaystyle='true'">
		<xsl:text>{\displaystyle </xsl:text>
	</xsl:if>
	<xsl:if test="@scriptlevel and not(@displaystyle='true')">
		<xsl:text>{</xsl:text>
		<xsl:choose>
			<xsl:when test="@scriptlevel=0"><xsl:text>\textstyle </xsl:text></xsl:when>
			<xsl:when test="@scriptlevel=1"><xsl:text>\scriptstyle </xsl:text></xsl:when>
			<xsl:otherwise><xsl:text>\scriptscriptstyle </xsl:text></xsl:otherwise>
		</xsl:choose>
	</xsl:if>
	<xsl:if test="@background">
		<xsl:text>\colorbox[rgb]{</xsl:text>
		<xsl:call-template name="color">
			<xsl:with-param name="color" select="@background"/>
		</xsl:call-template>
		<xsl:text>}{$</xsl:text>
	</xsl:if>
	<xsl:if test="@color[not(@mathcolor)] or @mathcolor">
		<xsl:text>\textcolor[rgb]{</xsl:text>
		<xsl:call-template name="color">
			<xsl:with-param name="color" select="@color|@mathcolor"/>
		</xsl:call-template>
		<xsl:text>}{</xsl:text>
	</xsl:if>
	<xsl:apply-templates/>
	<xsl:if test="@color[not(@mathcolor)] or @mathcolor">
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="@background">
		<xsl:text>$}</xsl:text>
	</xsl:if>
	<xsl:if test="@scriptlevel and not(@displaystyle='true')">
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="@displaystyle='true'">
		<xsl:text>}</xsl:text>
	</xsl:if>
</xsl:template><xsl:template match="m:merror">
	<xsl:apply-templates/>
</xsl:template>
<xsl:template match="m:munderover">
	<xsl:variable name="base" select="translate(./*[1],' ','')"/>
	<xsl:variable name="under" select="translate(./*[2],' ','')"/>
	<xsl:variable name="over" select="translate(./*[3],' ','')"/>
	<xsl:choose>
		<xsl:when test="$over='¯'">	<!-- OverBar - over bar -->
			<xsl:text>\overline{</xsl:text>
			<xsl:call-template name="munder">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="under" select="$under"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='︷'">	<!-- OverBrace - over brace -->
			<xsl:text>\overbrace{</xsl:text>
			<xsl:call-template name="munder">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="under" select="$under"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='←'">	<!--/leftarrow /gets A: =leftward arrow -->
			<xsl:text>\overleftarrow{</xsl:text>
			<xsl:call-template name="munder">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="under" select="$under"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='→'">	<!--/rightarrow /to A: =rightward arrow -->
			<xsl:text>\overrightarrow{</xsl:text>
			<xsl:call-template name="munder">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="under" select="$under"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='↔'">	<!--/leftrightarrow A: l&r arrow -->
			<xsl:text>\overleftrightarrow{</xsl:text>
			<xsl:call-template name="munder">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="under" select="$under"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='̲'">	<!-- UnderBar - combining low line -->
			<xsl:text>\underline{</xsl:text>
			<xsl:call-template name="mover">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="over" select="$over"/>
				<xsl:with-param name="pos_over" select="3"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='︸'">	<!-- UnderBrace - under brace -->
			<xsl:text>\underbrace{</xsl:text>
			<xsl:call-template name="mover">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="over" select="$over"/>
				<xsl:with-param name="pos_over" select="3"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='←'">	<!--/leftarrow /gets A: =leftward arrow -->
			<xsl:text>\underleftarrow{</xsl:text>
			<xsl:call-template name="mover">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="over" select="$over"/>
				<xsl:with-param name="pos_over" select="3"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='→'">	<!--/rightarrow /to A: =rightward arrow -->
			<xsl:text>\underrightarrow{</xsl:text>
			<xsl:call-template name="mover">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="over" select="$over"/>
				<xsl:with-param name="pos_over" select="3"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='↔'">	<!--/leftrightarrow A: l&r arrow -->
			<xsl:text>\underleftrightarrow{</xsl:text>
			<xsl:call-template name="mover">
				<xsl:with-param name="base" select="$base"/>
				<xsl:with-param name="over" select="$over"/>
				<xsl:with-param name="pos_over" select="3"/>
			</xsl:call-template>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="translate($base,'∏∐⋂⋃⊔',       '∑∑∑∑∑')='∑'">
<!-- if $base is operator, such as
			&#x02211;	/sum L: summation operator
			&#x0220F;	/prod L: product operator
			&#x02210;	/coprod L: coproduct operator
			&#x022c2;	/bigcap
			&#x022c3;	/bigcup
			&#x02294;	/bigsqcup
-->
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>_{</xsl:text>
			<xsl:apply-templates select="./*[2]"/>
			<xsl:text>}^{</xsl:text>
			<xsl:apply-templates select="./*[3]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>\underset{</xsl:text>
			<xsl:apply-templates select="./*[2]"/>
			<xsl:text>}{\overset{</xsl:text>
			<xsl:apply-templates select="./*[3]"/>
			<xsl:text>}{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}}</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:mover">
	<xsl:call-template name="mover">
		<xsl:with-param name="base" select="translate(./*[1],' ','')"/>
		<xsl:with-param name="over" select="translate(./*[2],' ','')"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:munder">
	<xsl:call-template name="munder">
		<xsl:with-param name="base" select="translate(./*[1],' ','')"/>
		<xsl:with-param name="under" select="translate(./*[2],' ','')"/>
	</xsl:call-template>
</xsl:template><xsl:template name="mover">
	<xsl:param name="base"/>
	<xsl:param name="over"/>
	<xsl:param name="pos_over" select="2"/>
	<xsl:choose>
		<xsl:when test="$over='¯'">	<!-- OverBar - over bar -->
			<xsl:text>\overline{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='︷'">	<!-- OverBrace - over brace -->
			<xsl:text>\overbrace{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='←'">	<!--/leftarrow /gets A: =leftward arrow -->
			<xsl:text>\overleftarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='→'">	<!--/rightarrow /to A: =rightward arrow -->
			<xsl:text>\overrightarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='↔'">	<!--/leftrightarrow A: l&r arrow -->
			<xsl:text>\overleftrightarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='˜'">	<!-- small tilde -->
			<xsl:text>\tilde{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='✓'">	<!-- /checkmark =tick, check mark -->
			<xsl:text>\check{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
			<xsl:when test="$over='˙'">	<!-- dot above -->
			<xsl:text>\dot{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$over='¨'">	<!-- DoubleDot - dieresis or umlaut mark -->
			<xsl:text>\ddot{</xsl:text>
 			<xsl:apply-templates select="./*[1]"/>
 			<xsl:text>}</xsl:text>
 		</xsl:when>
		<xsl:when test="$over='̂' or $over='^'"> <!-- Hat or circ - circumflex accent -->
			<xsl:choose>
				<xsl:when test="@accent='true'">
					<xsl:text>\widehat{</xsl:text>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>\hat{</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:apply-templates select="./*[1]"/><xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="translate($base,'∏∐⋂⋃⊔',       '∑∑∑∑∑')='∑'">
<!-- if $base is operator, such as
			&#x02211;	/sum L: summation operator
			&#x0220F;	/prod L: product operator
			&#x02210;	/coprod L: coproduct operator
			&#x022c2;	/bigcap
			&#x022c3;	/bigcup
			&#x02294;	/bigsqcup
-->
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>^{</xsl:text>
			<xsl:apply-templates select="./*[$pos_over]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>\stackrel{</xsl:text>
			<xsl:apply-templates select="./*[$pos_over]"/>
			<xsl:text>}{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
			<!--
			<xsl:text>\overset{</xsl:text>
			<xsl:apply-templates select="./*[$pos_over]"/>
			<xsl:text>}{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>-->
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="munder">
	<xsl:param name="base"/>
	<xsl:param name="under"/>
	<xsl:choose>
		<xsl:when test="$under='̲'">	<!-- UnderBar - combining low line -->
			<xsl:text>\underline{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='︸'">	<!-- UnderBrace - under brace -->
			<xsl:text>\underbrace{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='←'">	<!--/leftarrow /gets A: =leftward arrow -->
			<xsl:text>\underleftarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='→'">	<!--/rightarrow /to A: =rightward arrow -->
			<xsl:text>\underrightarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="$under='↔'">	<!--/leftrightarrow A: l&r arrow -->
			<xsl:text>\underleftrightarrow{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:when test="translate($base,'∏∐⋂⋃⊔',       '∑∑∑∑∑')='∑'">
<!-- if $base is operator, such as
			&#x02211;	/sum L: summation operator
			&#x0220F;	/prod L: product operator
			&#x02210;	/coprod L: coproduct operator
			&#x022c2;	/bigcap
			&#x022c3;	/bigcup
			&#x02294;	/bigsqcup
-->
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>_{</xsl:text>
			<xsl:apply-templates select="./*[2]"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>\underset{</xsl:text>		<!-- Required AmsMath package -->
			<xsl:apply-templates select="./*[2]"/>
			<xsl:text>}{</xsl:text>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:text>}</xsl:text>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:msubsup">
	<xsl:text>{</xsl:text>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:text>}_{</xsl:text>
	<xsl:apply-templates select="./*[2]"/>
	<xsl:text>}^{</xsl:text>
	<xsl:apply-templates select="./*[3]"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:msup">
	<xsl:text>{</xsl:text>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:text>}^{</xsl:text>
	<xsl:apply-templates select="./*[2]"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:msub">
	<xsl:text>{</xsl:text>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:text>}_{</xsl:text>
	<xsl:apply-templates select="./*[2]"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:mmultiscripts" mode="mprescripts">
	<xsl:for-each select="m:mprescripts/following-sibling::*">
		<xsl:if test="position() mod 2 and local-name(.)!='none'">
			<xsl:text>{}_{</xsl:text>
			<xsl:apply-templates select="."/>
			<xsl:text>}</xsl:text>
		</xsl:if>
		<xsl:if test="not(position() mod 2) and local-name(.)!='none'">
			<xsl:text>{}^{</xsl:text>
			<xsl:apply-templates select="."/>
			<xsl:text>}</xsl:text>
		</xsl:if>
	</xsl:for-each>
	<xsl:apply-templates select="./*[1]"/>
	<xsl:for-each select="m:mprescripts/preceding-sibling::*[position()!=last()]">
		<xsl:if test="position()&gt;2 and local-name(.)!='none'">
			<xsl:text>{}</xsl:text>
		</xsl:if>
		<xsl:if test="position() mod 2 and local-name(.)!='none'">
			<xsl:text>_{</xsl:text>
			<xsl:apply-templates select="."/>
			<xsl:text>}</xsl:text>
		</xsl:if>
		<xsl:if test="not(position() mod 2) and local-name(.)!='none'">
			<xsl:text>^{</xsl:text>
			<xsl:apply-templates select="."/>
			<xsl:text>}</xsl:text>
		</xsl:if>
	</xsl:for-each>
</xsl:template><xsl:template match="m:mmultiscripts">
	<xsl:choose>
		<xsl:when test="m:mprescripts">
			<xsl:apply-templates select="." mode="mprescripts"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="./*[1]"/>
			<xsl:for-each select="*[position()&gt;1]">
				<xsl:if test="position()&gt;2 and local-name(.)!='none'">
					<xsl:text>{}</xsl:text>
				</xsl:if>
				<xsl:if test="position() mod 2 and local-name(.)!='none'">
					<xsl:text>_{</xsl:text>
					<xsl:apply-templates select="."/>
					<xsl:text>}</xsl:text>
				</xsl:if>
				<xsl:if test="not(position() mod 2) and local-name(.)!='none'">
					<xsl:text>^{</xsl:text>
					<xsl:apply-templates select="."/>
					<xsl:text>}</xsl:text>
				</xsl:if>
			</xsl:for-each>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
<xsl:template match="m:mtd[@columnspan]">
	<xsl:text>\multicolumn{</xsl:text>
	<xsl:value-of select="@columnspan"/>
	<xsl:text>}{c}{</xsl:text>
	<xsl:apply-templates/>
	<xsl:text>}</xsl:text>
	<xsl:if test="count(following-sibling::*)&gt;0">
		<xsl:text>&amp; </xsl:text>
	</xsl:if>
</xsl:template><xsl:template match="m:mtd">
	<xsl:if test="@columnalign='right' or @columnalign='center'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:apply-templates/>
	<xsl:if test="@columnalign='left' or @columnalign='center'">
		<xsl:text>\hfill </xsl:text>
	</xsl:if>
	<xsl:if test="count(following-sibling::*)&gt;0">
<!--    this test valid for Sablotron, another form - test="not(position()=last())".
	Also for m:mtd[@columnspan] and m:mtr  -->
		<xsl:text>&amp; </xsl:text>
	</xsl:if>
</xsl:template><xsl:template match="m:mtr">
	<xsl:apply-templates/>
	<xsl:if test="count(following-sibling::*)&gt;0">
		<xsl:text>\\ </xsl:text>
	</xsl:if>
</xsl:template><xsl:template match="m:mtable">
	<xsl:text>\begin{array}{</xsl:text>
	<xsl:if test="@frame='solid'">
		<xsl:text>|</xsl:text>
	</xsl:if>
	<xsl:variable name="numbercols" select="count(./m:mtr[1]/m:mtd[not(@columnspan)])+sum(./m:mtr[1]/m:mtd/@columnspan)"/>
	<xsl:choose>
		<xsl:when test="@columnalign">
			<xsl:variable name="colalign">
				<xsl:call-template name="colalign">
					<xsl:with-param name="colalign" select="@columnalign"/>
				</xsl:call-template>
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="string-length($colalign) &gt; $numbercols">
					<xsl:value-of select="substring($colalign,1,$numbercols)"/>
				</xsl:when>
				<xsl:when test="string-length($colalign) &lt; $numbercols">
					<xsl:value-of select="$colalign"/>
					<xsl:call-template name="generate-string">
						<xsl:with-param name="text" select="substring($colalign,string-length($colalign))"/>
						<xsl:with-param name="count" select="$numbercols - string-length($colalign)"/>
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$colalign"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="generate-string">
				<xsl:with-param name="text" select="'c'"/>
				<xsl:with-param name="count" select="$numbercols"/>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:if test="@frame='solid'">
		<xsl:text>|</xsl:text>
	</xsl:if>
	<xsl:text>}</xsl:text>
	<xsl:if test="@frame='solid'">
		<xsl:text>\hline </xsl:text>
	</xsl:if>
	<xsl:apply-templates/>
	<xsl:if test="@frame='solid'">
		<xsl:text>\\ \hline</xsl:text>
	</xsl:if>
	<xsl:text>\end{array}</xsl:text>
</xsl:template><xsl:template name="colalign">
	<xsl:param name="colalign"/>
	<xsl:choose>
		<xsl:when test="contains($colalign,' ')">
			<xsl:value-of select="substring($colalign,1,1)"/>
			<xsl:call-template name="colalign">
				<xsl:with-param name="colalign" select="substring-after($colalign,' ')"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="substring($colalign,1,1)"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template name="generate-string">
<!-- template from XSLT Standard Library v1.1 -->
    <xsl:param name="text"/>
    <xsl:param name="count"/>

    <xsl:choose>
      <xsl:when test="string-length($text) = 0 or $count &lt;= 0"/>

      <xsl:otherwise>
	<xsl:value-of select="$text"/>
	<xsl:call-template name="generate-string">
	  <xsl:with-param name="text" select="$text"/>
	  <xsl:with-param name="count" select="$count - 1"/>
	</xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
</xsl:template>
<xsl:template name="replaceEntities">
	<xsl:param name="content"/>
	<xsl:if test="string-length($content)&gt;0">
	<xsl:choose>
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="'\; '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,'ɛ')"><xsl:value-of select="'\varepsilon '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ɛ')"/></xsl:call-template></xsl:when>	<!--/varepsilon -->
		<xsl:when test="starts-with($content,'˙')"><xsl:value-of select="'\dot{}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '˙')"/></xsl:call-template></xsl:when>		<!--/DiacriticalDot -->
<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	C1 Controls and Latin-1 Supplement
	Range: 0080-00FF
	http://www.unicode.org/charts/PDF/U0080.pdf	                    -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'£')"><xsl:value-of select="'\pounds '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '£')"/></xsl:call-template></xsl:when>	<!--pound sign -->
		<xsl:when test="starts-with($content,'¥')"><xsl:value-of select="'\yen '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '¥')"/></xsl:call-template></xsl:when>	<!--/yen =yen sign --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'§')"><xsl:value-of select="'\S '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '§')"/></xsl:call-template></xsl:when>	<!--section sign -->
		<xsl:when test="starts-with($content,'©')"><xsl:value-of select="'\copyright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '©')"/></xsl:call-template></xsl:when>	<!--copyright sign -->
		<xsl:when test="starts-with($content,'¬')"><xsl:value-of select="'\neg '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '¬')"/></xsl:call-template></xsl:when>	<!--/neg /lnot =not sign -->
		<xsl:when test="starts-with($content,'®')"><xsl:value-of select="'\circledR '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '®')"/></xsl:call-template></xsl:when>	<!--/circledR =registered sign --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'±')"><xsl:value-of select="'\pm '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '±')"/></xsl:call-template></xsl:when>	<!--/pm B: =plus-or-minus sign -->
		<xsl:when test="starts-with($content,'µ')"><xsl:value-of select="'\mu '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'µ')"/></xsl:call-template></xsl:when>	<!--=micro sign -->
		<xsl:when test="starts-with($content,'¶')"><xsl:value-of select="'\P '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '¶')"/></xsl:call-template></xsl:when>	<!--pilcrow (paragraph sign) -->
		<xsl:when test="starts-with($content,'Å')"><xsl:value-of select="'\AA '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Å')"/></xsl:call-template></xsl:when>	<!--capital A, ring --> <!-- invalid in math mode -->
		<xsl:when test="starts-with($content,'Æ')"><xsl:value-of select="'\AE '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Æ')"/></xsl:call-template></xsl:when>	<!--capital AE diphthong (ligature) --> <!-- invalid in math mode -->
		<xsl:when test="starts-with($content,'×')"><xsl:value-of select="'\times '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '×')"/></xsl:call-template></xsl:when>	<!--/times B: =multiply sign -->
		<xsl:when test="starts-with($content,'æ')"><xsl:value-of select="'\ae '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'æ')"/></xsl:call-template></xsl:when>	<!--small ae diphthong (ligature) --> <!-- invalid in math mode -->

<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	Greek
	Range: 0370-03FF
	http://www.unicode.org/charts/PDF/U0370.pdf	                    -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'Α')"><xsl:value-of select="'{\rm A}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Α')"/></xsl:call-template></xsl:when>	<!--greek capital letter alpha -->
		<xsl:when test="starts-with($content,'Β')"><xsl:value-of select="'{\rm B}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Β')"/></xsl:call-template></xsl:when>	<!-- greek capital letter beta -->
		<xsl:when test="starts-with($content,'Γ')"><xsl:value-of select="'\Gamma '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Γ')"/></xsl:call-template></xsl:when>	<!--/Gamma capital Gamma, Greek -->
		<xsl:when test="starts-with($content,'Δ')"><xsl:value-of select="'\Delta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Δ')"/></xsl:call-template></xsl:when>	<!--/Delta capital Delta, Greek -->
		<xsl:when test="starts-with($content,'Ε')"><xsl:value-of select="'{\rm E}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ε')"/></xsl:call-template></xsl:when>	<!-- greek capital letter epsilon -->
		<xsl:when test="starts-with($content,'Ζ')"><xsl:value-of select="'{\rm Z}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ζ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter zeta -->
		<xsl:when test="starts-with($content,'Η')"><xsl:value-of select="'{\rm H}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Η')"/></xsl:call-template></xsl:when>	<!-- greek capital letter eta -->
		<xsl:when test="starts-with($content,'Θ')"><xsl:value-of select="'\Theta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Θ')"/></xsl:call-template></xsl:when>	<!--/Theta capital Theta, Greek -->
		<xsl:when test="starts-with($content,'Ι')"><xsl:value-of select="'{\rm I}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ι')"/></xsl:call-template></xsl:when>	<!-- greek capital letter iota -->
		<xsl:when test="starts-with($content,'Κ')"><xsl:value-of select="'{\rm K}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Κ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter kappa -->
		<xsl:when test="starts-with($content,'Λ')"><xsl:value-of select="'\Lambda '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Λ')"/></xsl:call-template></xsl:when>	<!--/Lambda capital Lambda, Greek -->
		<xsl:when test="starts-with($content,'Μ')"><xsl:value-of select="'{\rm M}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Μ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter mu -->
		<xsl:when test="starts-with($content,'Ν')"><xsl:value-of select="'{\rm N}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ν')"/></xsl:call-template></xsl:when>	<!-- greek capital letter nu -->
		<xsl:when test="starts-with($content,'Ξ')"><xsl:value-of select="'\Xi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ξ')"/></xsl:call-template></xsl:when>	<!--/Xi capital Xi, Greek -->
		<xsl:when test="starts-with($content,'Ο')"><xsl:value-of select="'{\rm O}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ο')"/></xsl:call-template></xsl:when>	<!-- greek capital letter omicron -->
		<xsl:when test="starts-with($content,'Π')"><xsl:value-of select="'\Pi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Π')"/></xsl:call-template></xsl:when>	<!--/Pi capital Pi, Greek -->
		<xsl:when test="starts-with($content,'Ρ')"><xsl:value-of select="'{\rm P}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ρ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter rho -->
		<xsl:when test="starts-with($content,'Σ')"><xsl:value-of select="'\Sigma '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Σ')"/></xsl:call-template></xsl:when>	<!--/Sigma capital Sigma, Greek -->
		<xsl:when test="starts-with($content,'Τ')"><xsl:value-of select="'{\rm T}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Τ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter tau -->
		<xsl:when test="starts-with($content,'Υ')"><xsl:value-of select="'{\rm Y}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Υ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter upsilon -->
		<xsl:when test="starts-with($content,'Φ')"><xsl:value-of select="'\Phi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Φ')"/></xsl:call-template></xsl:when>	<!--/Phi capital Phi, Greek -->
		<xsl:when test="starts-with($content,'Χ')"><xsl:value-of select="'{\rm X}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Χ')"/></xsl:call-template></xsl:when>	<!-- greek capital letter chi -->
		<xsl:when test="starts-with($content,'Ψ')"><xsl:value-of select="'\Psi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ψ')"/></xsl:call-template></xsl:when>	<!--/Psi capital Psi, Greek -->
		<xsl:when test="starts-with($content,'Ω')"><xsl:value-of select="'\Omega '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ω')"/></xsl:call-template></xsl:when>	<!--/Omega capital Omega, Greek -->
		<xsl:when test="starts-with($content,'α')"><xsl:value-of select="'\alpha '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'α')"/></xsl:call-template></xsl:when>	<!--/alpha small alpha, Greek -->
		<xsl:when test="starts-with($content,'β')"><xsl:value-of select="'\beta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'β')"/></xsl:call-template></xsl:when>	<!--/beta small beta, Greek -->
		<xsl:when test="starts-with($content,'γ')"><xsl:value-of select="'\gamma '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'γ')"/></xsl:call-template></xsl:when>	<!--/gamma small gamma, Greek -->
		<xsl:when test="starts-with($content,'δ')"><xsl:value-of select="'\delta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'δ')"/></xsl:call-template></xsl:when>	<!--/delta small delta, Greek -->
		<xsl:when test="starts-with($content,'ε')"><xsl:value-of select="'\epsilon '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ε')"/></xsl:call-template></xsl:when>	<!--/straightepsilon, small epsilon, Greek -->
		<xsl:when test="starts-with($content,'ζ')"><xsl:value-of select="'\zeta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ζ')"/></xsl:call-template></xsl:when>	<!--/zeta small zeta, Greek -->
		<xsl:when test="starts-with($content,'η')"><xsl:value-of select="'\eta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'η')"/></xsl:call-template></xsl:when>	<!--/eta small eta, Greek -->
		<xsl:when test="starts-with($content,'θ')"><xsl:value-of select="'\theta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'θ')"/></xsl:call-template></xsl:when>	<!--/theta straight theta, small theta, Greek -->
		<xsl:when test="starts-with($content,'ι')"><xsl:value-of select="'\iota '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ι')"/></xsl:call-template></xsl:when>	<!--/iota small iota, Greek -->
		<xsl:when test="starts-with($content,'κ')"><xsl:value-of select="'\kappa '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'κ')"/></xsl:call-template></xsl:when>	<!--/kappa small kappa, Greek -->
		<xsl:when test="starts-with($content,'λ')"><xsl:value-of select="'\lambda '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'λ')"/></xsl:call-template></xsl:when>	<!--/lambda small lambda, Greek -->
		<xsl:when test="starts-with($content,'μ')"><xsl:value-of select="'\mu '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'μ')"/></xsl:call-template></xsl:when>	<!--/mu small mu, Greek -->
		<xsl:when test="starts-with($content,'ν')"><xsl:value-of select="'\nu '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ν')"/></xsl:call-template></xsl:when>	<!--/nu small nu, Greek -->
		<xsl:when test="starts-with($content,'ξ')"><xsl:value-of select="'\xi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ξ')"/></xsl:call-template></xsl:when>	<!--/xi small xi, Greek -->
		<xsl:when test="starts-with($content,'ο')"><xsl:value-of select="'o'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ο')"/></xsl:call-template></xsl:when>	<!--small omicron, Greek -->
		<xsl:when test="starts-with($content,'π')"><xsl:value-of select="'\pi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'π')"/></xsl:call-template></xsl:when>	<!--/pi small pi, Greek -->
		<xsl:when test="starts-with($content,'ρ')"><xsl:value-of select="'\rho '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ρ')"/></xsl:call-template></xsl:when>	<!--/rho small rho, Greek -->
		<xsl:when test="starts-with($content,'ς')"><xsl:value-of select="'\varsigma '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ς')"/></xsl:call-template></xsl:when>	<!--/varsigma -->
		<xsl:when test="starts-with($content,'σ')"><xsl:value-of select="'\sigma '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'σ')"/></xsl:call-template></xsl:when>	<!--/sigma small sigma, Greek -->
		<xsl:when test="starts-with($content,'τ')"><xsl:value-of select="'\tau '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'τ')"/></xsl:call-template></xsl:when>	<!--/tau small tau, Greek -->
		<xsl:when test="starts-with($content,'υ')"><xsl:value-of select="'\upsilon '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'υ')"/></xsl:call-template></xsl:when>	<!--/upsilon small upsilon, Greek -->
		<xsl:when test="starts-with($content,'φ')"><xsl:value-of select="'\phi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'φ')"/></xsl:call-template></xsl:when>	<!--/straightphi - small phi, Greek -->
		<xsl:when test="starts-with($content,'χ')"><xsl:value-of select="'\chi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'χ')"/></xsl:call-template></xsl:when>	<!--/chi small chi, Greek -->
		<xsl:when test="starts-with($content,'ψ')"><xsl:value-of select="'\psi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ψ')"/></xsl:call-template></xsl:when>	<!--/psi small psi, Greek -->
		<xsl:when test="starts-with($content,'ω')"><xsl:value-of select="'\omega '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ω')"/></xsl:call-template></xsl:when>	<!--/omega small omega, Greek -->
		<xsl:when test="starts-with($content,'ϑ')"><xsl:value-of select="'\vartheta '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϑ')"/></xsl:call-template></xsl:when>	<!--/vartheta - curly or open theta -->
		<xsl:when test="starts-with($content,'ϒ')"><xsl:value-of select="'\Upsilon '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϒ')"/></xsl:call-template></xsl:when>	<!--/Upsilon capital Upsilon, Greek -->
		<xsl:when test="starts-with($content,'ϕ')"><xsl:value-of select="'\varphi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϕ')"/></xsl:call-template></xsl:when>	<!--/varphi - curly or open phi -->
		<xsl:when test="starts-with($content,'ϖ')"><xsl:value-of select="'\varpi '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϖ')"/></xsl:call-template></xsl:when>	<!--/varpi -->
		<xsl:when test="starts-with($content,'ϰ')"><xsl:value-of select="'\varkappa '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϰ')"/></xsl:call-template></xsl:when>	<!--/varkappa -->
		<xsl:when test="starts-with($content,'ϱ')"><xsl:value-of select="'\varrho '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ϱ')"/></xsl:call-template></xsl:when>	<!--/varrho -->

<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	General Punctuation
	Range: 2000-206F
	http://www.unicode.org/charts/PDF/U2000.pdf	                    -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.5em}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> 	<!-- en space (1/2-em) -->
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{1em}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>		<!-- emsp - space of width 1em -->
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.33em}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>	<!-- emsp13 - space of width 1/3 em -->
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.25em}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>	<!-- ThickSpace - space of width 1/4 em -->
		<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.17em}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>	<!-- ThinSpace - space of width 3/18 em -->
		<xsl:when test="starts-with($content,'​')"><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '​')"/></xsl:call-template></xsl:when>	<!--zero width space -->
		<xsl:when test="starts-with($content,'‖')"><xsl:value-of select="'\Vert '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '‖')"/></xsl:call-template></xsl:when>	<!--/Vert dbl vertical bar -->
		<xsl:when test="starts-with($content,'…')"><xsl:value-of select="'\dots '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '…')"/></xsl:call-template></xsl:when>	<!--horizontal ellipsis = three dot leader -->
		<xsl:when test="starts-with($content,'′')"><xsl:value-of select="'\prime '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '′')"/></xsl:call-template></xsl:when>	<!--/prime prime or minute -->
		<xsl:when test="starts-with($content,'⁡')"><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⁡')"/></xsl:call-template></xsl:when>	<!-- ApplyFunction -->
		<xsl:when test="starts-with($content,'⁢')"><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⁢')"/></xsl:call-template></xsl:when>	<!-- InvisibleTimes -->
		<xsl:when test="starts-with($content,'⁣')"><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⁣')"/></xsl:call-template></xsl:when>	<!-- InvisibleComma, used as a separator, e.g., in indices -->
<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	Letterlike Symbols
	Range: 2100-214F
	http://www.unicode.org/charts/PDF/U2100.pdf	                    -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'ℋ')"><xsl:value-of select="'\mathscr{H}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℋ')"/></xsl:call-template></xsl:when>	<!--H Hamiltonian -->
		<xsl:when test="starts-with($content,'ℏ︀')"><xsl:value-of select="'\hbar '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℏ︀')"/></xsl:call-template></xsl:when>	<!--/hbar - Planck's over 2pi -->
		<xsl:when test="starts-with($content,'ℏ')"><xsl:value-of select="'\hslash '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℏ')"/></xsl:call-template></xsl:when>	<!--/hslash - variant Planck's over 2pi --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ℑ')"><xsl:value-of select="'\Im '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℑ')"/></xsl:call-template></xsl:when>		<!--/Im - imaginary   -->
		<xsl:when test="starts-with($content,'ℓ')"><xsl:value-of select="'\ell '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℓ')"/></xsl:call-template></xsl:when>		<!--/ell - cursive small l -->
		<xsl:when test="starts-with($content,'ℕ')"><xsl:value-of select="'\mathbb{N}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℕ')"/></xsl:call-template></xsl:when>	<!--the semi-ring of natural numbers --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'℘')"><xsl:value-of select="'\wp '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '℘')"/></xsl:call-template></xsl:when>		<!--/wp - Weierstrass p -->
		<xsl:when test="starts-with($content,'ℙ')"><xsl:value-of select="'\mathbb{P}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℙ')"/></xsl:call-template></xsl:when>	<!--the prime natural numbers --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ℚ')"><xsl:value-of select="'\mathbb{Q}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℚ')"/></xsl:call-template></xsl:when>	<!--the field of rational numbers --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ℜ')"><xsl:value-of select="'\Re '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℜ')"/></xsl:call-template></xsl:when>		<!--/Re - real -->
		<xsl:when test="starts-with($content,'ℤ')"><xsl:value-of select="'\mathbb{Z}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℤ')"/></xsl:call-template></xsl:when>	<!--the ring of integers --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'Ω')"><xsl:value-of select="'\Omega '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'Ω')"/></xsl:call-template></xsl:when>		<!--ohm sign -->
		<xsl:when test="starts-with($content,'℧')"><xsl:value-of select="'\mho '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '℧')"/></xsl:call-template></xsl:when>		<!--/mho - conductance -->
		<xsl:when test="starts-with($content,'ℵ')"><xsl:value-of select="'\aleph '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℵ')"/></xsl:call-template></xsl:when>		<!--/aleph aleph, Hebrew -->
		<xsl:when test="starts-with($content,'ℶ')"><xsl:value-of select="'\beth '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℶ')"/></xsl:call-template></xsl:when>		<!--/beth - beth, Hebrew --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ℷ')"><xsl:value-of select="'\gimel '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℷ')"/></xsl:call-template></xsl:when>		<!--/gimel - gimel, Hebrew --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ℸ')"><xsl:value-of select="'\daleth '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ℸ')"/></xsl:call-template></xsl:when>	<!--/daleth - daleth, Hebrew --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'ⅅ')"><xsl:value-of select="'D'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ⅅ')"/></xsl:call-template></xsl:when>		<!--D for use in differentials, e.g., within integrals -->
		<xsl:when test="starts-with($content,'ⅆ')"><xsl:value-of select="'d'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ⅆ')"/></xsl:call-template></xsl:when>		<!--d for use in differentials, e.g., within integrals -->
		<xsl:when test="starts-with($content,'ⅇ')"><xsl:value-of select="'e'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ⅇ')"/></xsl:call-template></xsl:when>		<!--e use for the exponential base of the natural logarithms -->
		<xsl:when test="starts-with($content,'ⅈ')"><xsl:value-of select="'i'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ⅈ')"/></xsl:call-template></xsl:when>		<!--i for use as a square root of -1 -->
		<xsl:when test="starts-with($content,'ⅉ')"><xsl:value-of select="'j'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, 'ⅉ')"/></xsl:call-template></xsl:when>

<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	Arrows
	Range: 2190-21FF
	http://www.unicode.org/charts/PDF/U2190.pdf	                    -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'←')"><xsl:value-of select="'\leftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '←')"/></xsl:call-template></xsl:when>	<!--/leftarrow /gets A: =leftward arrow -->
		<xsl:when test="starts-with($content,'↑')"><xsl:value-of select="'\uparrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↑')"/></xsl:call-template></xsl:when>	<!--/uparrow A: =upward arrow -->
  		<xsl:when test="starts-with($content,'→')"><xsl:value-of select="'\to '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '→')"/></xsl:call-template></xsl:when>		<!--/rightarrow /to A: =rightward arrow -->
		<xsl:when test="starts-with($content,'↓')"><xsl:value-of select="'\downarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↓')"/></xsl:call-template></xsl:when>	<!--/downarrow A: =downward arrow -->
		<xsl:when test="starts-with($content,'↔')"><xsl:value-of select="'\leftrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↔')"/></xsl:call-template></xsl:when>	<!--/leftrightarrow A: l&r arrow -->
		<xsl:when test="starts-with($content,'↕')"><xsl:value-of select="'\updownarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↕')"/></xsl:call-template></xsl:when>	<!--/updownarrow A: up&down arrow -->
		<xsl:when test="starts-with($content,'↖')"><xsl:value-of select="'\nwarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↖')"/></xsl:call-template></xsl:when>	<!--/nwarrow A: NW pointing arrow -->
		<xsl:when test="starts-with($content,'↗')"><xsl:value-of select="'\nearrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↗')"/></xsl:call-template></xsl:when>	<!--/nearrow A: NE pointing arrow -->
		<xsl:when test="starts-with($content,'↘')"><xsl:value-of select="'\searrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↘')"/></xsl:call-template></xsl:when>	<!--/searrow A: SE pointing arrow -->
		<xsl:when test="starts-with($content,'↙')"><xsl:value-of select="'\swarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↙')"/></xsl:call-template></xsl:when>	<!--/swarrow A: SW pointing arrow -->
		<xsl:when test="starts-with($content,'↚')"><xsl:value-of select="'\nleftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↚')"/></xsl:call-template></xsl:when>	<!--/nleftarrow A: not left arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↛')"><xsl:value-of select="'\nrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↛')"/></xsl:call-template></xsl:when>	<!--/nrightarrow A: not right arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↝')"><xsl:value-of select="'\rightsquigarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↝')"/></xsl:call-template></xsl:when>	<!--/rightsquigarrow A: rt arrow-wavy --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↞')"><xsl:value-of select="'\twoheadleftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↞')"/></xsl:call-template></xsl:when>	<!--/twoheadleftarrow A: --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↠')"><xsl:value-of select="'\twoheadrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↠')"/></xsl:call-template></xsl:when>	<!--/twoheadrightarrow A: --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↢')"><xsl:value-of select="'\leftarrowtail '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↢')"/></xsl:call-template></xsl:when>	<!--/leftarrowtail A: left arrow-tailed --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↣')"><xsl:value-of select="'\rightarrowtail '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↣')"/></xsl:call-template></xsl:when>	<!--/rightarrowtail A: rt arrow-tailed --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↦')"><xsl:value-of select="'\mapsto '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↦')"/></xsl:call-template></xsl:when>	<!--/mapsto A: -->
		<xsl:when test="starts-with($content,'↩')"><xsl:value-of select="'\hookleftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↩')"/></xsl:call-template></xsl:when>	<!--/hookleftarrow A: left arrow-hooked -->
		<xsl:when test="starts-with($content,'↪')"><xsl:value-of select="'\hookrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↪')"/></xsl:call-template></xsl:when>	<!--/hookrightarrow A: rt arrow-hooked -->
		<xsl:when test="starts-with($content,'↫')"><xsl:value-of select="'\looparrowleft '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↫')"/></xsl:call-template></xsl:when>	<!--/looparrowleft A: left arrow-looped --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↬')"><xsl:value-of select="'\looparrowright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↬')"/></xsl:call-template></xsl:when>	<!--/looparrowright A: rt arrow-looped --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↭')"><xsl:value-of select="'\leftrightsquigarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↭')"/></xsl:call-template></xsl:when>	<!--/leftrightsquigarrow A: l&r arr-wavy --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↮')"><xsl:value-of select="'\nleftrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↮')"/></xsl:call-template></xsl:when>	<!--/nleftrightarrow A: not l&r arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↰')"><xsl:value-of select="'\Lsh '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↰')"/></xsl:call-template></xsl:when>	<!--/Lsh A: --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↱')"><xsl:value-of select="'\Rsh '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↱')"/></xsl:call-template></xsl:when>	<!--/Rsh A: --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↶')"><xsl:value-of select="'\curvearrowleft '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↶')"/></xsl:call-template></xsl:when>	<!--/curvearrowleft A: left curved arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↷')"><xsl:value-of select="'\curvearrowright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↷')"/></xsl:call-template></xsl:when>	<!--/curvearrowright A: rt curved arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↺')"><xsl:value-of select="'\circlearrowleft '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↺')"/></xsl:call-template></xsl:when>	<!--/circlearrowleft A: l arr in circle --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↻')"><xsl:value-of select="'\circlearrowright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↻')"/></xsl:call-template></xsl:when>	<!--/circlearrowright A: r arr in circle --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↼')"><xsl:value-of select="'\leftharpoonup '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↼')"/></xsl:call-template></xsl:when>	<!--/leftharpoonup A: left harpoon-up -->
		<xsl:when test="starts-with($content,'↽')"><xsl:value-of select="'\leftharpoondown '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↽')"/></xsl:call-template></xsl:when>	<!--/leftharpoondown A: l harpoon-down -->
		<xsl:when test="starts-with($content,'↾')"><xsl:value-of select="'\upharpoonright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↾')"/></xsl:call-template></xsl:when>	<!--/upharpoonright /restriction A: up harp-r --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'↿')"><xsl:value-of select="'\upharpoonleft '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '↿')"/></xsl:call-template></xsl:when>	<!--/upharpoonleft A: up harpoon-left --> <!-- Required amssymb -->
 		<xsl:when test="starts-with($content,'⇀')"><xsl:value-of select="'\rightharpoonup '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇀')"/></xsl:call-template></xsl:when>		<!--/rightharpoonup A: rt harpoon-up -->
		<xsl:when test="starts-with($content,'⇁')"><xsl:value-of select="'\rightharpoondown '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇁')"/></xsl:call-template></xsl:when>	<!--/rightharpoondown A: rt harpoon-down -->
		<xsl:when test="starts-with($content,'⇂')"><xsl:value-of select="'\downharpoonright '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇂')"/></xsl:call-template></xsl:when>	<!--/downharpoonright A: down harpoon-rt --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇃')"><xsl:value-of select="'\downharpoonleft '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇃')"/></xsl:call-template></xsl:when>	<!--/downharpoonleft A: dn harpoon-left --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇄')"><xsl:value-of select="'\rightleftarrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇄')"/></xsl:call-template></xsl:when>	<!--/rightleftarrows A: r arr over l arr --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇆')"><xsl:value-of select="'\leftrightarrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇆')"/></xsl:call-template></xsl:when>	<!--/leftrightarrows A: l arr over r arr --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇇')"><xsl:value-of select="'\leftleftarrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇇')"/></xsl:call-template></xsl:when>	<!--/leftleftarrows A: two left arrows --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇈')"><xsl:value-of select="'\upuparrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇈')"/></xsl:call-template></xsl:when>	<!--/upuparrows A: two up arrows --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇉')"><xsl:value-of select="'\rightrightarrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇉')"/></xsl:call-template></xsl:when>	<!--/rightrightarrows A: two rt arrows --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇊')"><xsl:value-of select="'\downdownarrows '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇊')"/></xsl:call-template></xsl:when>	<!--/downdownarrows A: two down arrows --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇋')"><xsl:value-of select="'\leftrightharpoons '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇋')"/></xsl:call-template></xsl:when>	<!--/leftrightharpoons A: l harp over r -->
		<xsl:when test="starts-with($content,'⇌')"><xsl:value-of select="'\rightleftharpoons '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇌')"/></xsl:call-template></xsl:when>	<!--/rightleftharpoons A: r harp over l -->
		<xsl:when test="starts-with($content,'⇍')"><xsl:value-of select="'\nLeftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇍')"/></xsl:call-template></xsl:when>	<!--/nLeftarrow A: not implied by --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇎')"><xsl:value-of select="'\nLeftrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇎')"/></xsl:call-template></xsl:when>	<!--/nLeftrightarrow A: not l&r dbl arr --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇏')"><xsl:value-of select="'\nRightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇏')"/></xsl:call-template></xsl:when>	<!--/nRightarrow A: not implies --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇐')"><xsl:value-of select="'\Leftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇐')"/></xsl:call-template></xsl:when>	<!--/Leftarrow A: is implied by -->
		<xsl:when test="starts-with($content,'⇑')"><xsl:value-of select="'\Uparrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇑')"/></xsl:call-template></xsl:when>	<!--/Uparrow A: up dbl arrow -->
		<xsl:when test="starts-with($content,'⇒')"><xsl:value-of select="'\Rightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇒')"/></xsl:call-template></xsl:when>	<!--/Rightarrow A: implies -->
		<xsl:when test="starts-with($content,'⇓')"><xsl:value-of select="'\Downarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇓')"/></xsl:call-template></xsl:when>	<!--/Downarrow A: down dbl arrow -->
<!--		<xsl:when test="starts-with($content,'&#x021D4;')"><xsl:value-of select="'\Leftrightarrow '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x021D4;')"/></xsl:call-template></xsl:when>	/Leftrightarrow A: l&r dbl arrow -->
		<xsl:when test="starts-with($content,'⇔')"><xsl:value-of select="'\iff '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇔')"/></xsl:call-template></xsl:when>	<!--/iff if and only if	-->
		<xsl:when test="starts-with($content,'⇕')"><xsl:value-of select="'\Updownarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇕')"/></xsl:call-template></xsl:when>	<!--/Updownarrow A: up&down dbl arrow -->
		<xsl:when test="starts-with($content,'⇚')"><xsl:value-of select="'\Lleftarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇚')"/></xsl:call-template></xsl:when>	<!--/Lleftarrow A: left triple arrow --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⇛')"><xsl:value-of select="'\Rrightarrow '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⇛')"/></xsl:call-template></xsl:when>	<!--/Rrightarrow A: right triple arrow --> <!-- Required amssymb -->

<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	Mathematical Operators
	Range: 2200-22FF
	http://www.unicode.org/charts/PDF/U2200.pdf                         -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'∀')"><xsl:value-of select="'\forall '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∀')"/></xsl:call-template></xsl:when>	<!--/forall for all -->
		<xsl:when test="starts-with($content,'∁')"><xsl:value-of select="'\complement '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∁')"/></xsl:call-template></xsl:when>	<!--/complement - complement sign --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∂')"><xsl:value-of select="'\partial '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∂')"/></xsl:call-template></xsl:when>	<!--/partial partial differential -->
		<xsl:when test="starts-with($content,'∃')"><xsl:value-of select="'\exists '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∃')"/></xsl:call-template></xsl:when>	<!--/exists at least one exists -->
		<xsl:when test="starts-with($content,'∄')"><xsl:value-of select="'\nexists '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∄')"/></xsl:call-template></xsl:when>	<!--/nexists - negated exists --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∅︀')"><xsl:value-of select="'\emptyset '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∅︀')"/></xsl:call-template></xsl:when>	<!--/emptyset - zero, slash -->
		<xsl:when test="starts-with($content,'∅')"><xsl:value-of select="'\varnothing '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∅')"/></xsl:call-template></xsl:when>	<!--/varnothing - circle, slash --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x02206;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02206;')"/></xsl:call-template></xsl:when>-->
		<xsl:when test="starts-with($content,'∇')"><xsl:value-of select="'\nabla '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∇')"/></xsl:call-template></xsl:when>		<!--/nabla del, Hamilton operator -->
		<xsl:when test="starts-with($content,'∈')"><xsl:value-of select="'\in '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∈')"/></xsl:call-template></xsl:when>		<!--/in R: set membership  -->
		<xsl:when test="starts-with($content,'∉')"><xsl:value-of select="'\notin '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∉')"/></xsl:call-template></xsl:when>		<!--/notin N: negated set membership -->
		<xsl:when test="starts-with($content,'∋')"><xsl:value-of select="'\ni '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∋')"/></xsl:call-template></xsl:when>		<!--/ni /owns R: contains -->
		<xsl:when test="starts-with($content,'∌')"><xsl:value-of select="'\not\ni '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∌')"/></xsl:call-template></xsl:when>	<!--negated contains -->
		<xsl:when test="starts-with($content,'∏')"><xsl:value-of select="'\prod '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∏')"/></xsl:call-template></xsl:when>		<!--/prod L: product operator -->
		<xsl:when test="starts-with($content,'∐')"><xsl:value-of select="'\coprod '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∐')"/></xsl:call-template></xsl:when>	<!--/coprod L: coproduct operator -->
		<xsl:when test="starts-with($content,'∑')"><xsl:value-of select="'\sum '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∑')"/></xsl:call-template></xsl:when>		<!--/sum L: summation operator -->
		<xsl:when test="starts-with($content,'−')"><xsl:value-of select="'-'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '−')"/></xsl:call-template></xsl:when>		<!--B: minus sign -->
		<xsl:when test="starts-with($content,'∓')"><xsl:value-of select="'\mp '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∓')"/></xsl:call-template></xsl:when>		<!--/mp B: minus-or-plus sign -->
		<xsl:when test="starts-with($content,'∔')"><xsl:value-of select="'\dotplus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∔')"/></xsl:call-template></xsl:when>	<!--/dotplus B: plus sign, dot above --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x02215;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02215;')"/></xsl:call-template></xsl:when>-->
		<xsl:when test="starts-with($content,'∖')"><xsl:value-of select="'\setminus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∖')"/></xsl:call-template></xsl:when>	<!--/setminus B: reverse solidus -->
		<xsl:when test="starts-with($content,'∗')"><xsl:value-of select="'\ast '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∗')"/></xsl:call-template></xsl:when>		<!--low asterisk -->
		<xsl:when test="starts-with($content,'∘')"><xsl:value-of select="'\circ '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∘')"/></xsl:call-template></xsl:when>		<!--/circ B: composite function (small circle) -->
		<xsl:when test="starts-with($content,'∙')"><xsl:value-of select="'\bullet '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∙')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,'√')"><xsl:value-of select="'\surd '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '√')"/></xsl:call-template></xsl:when>		<!--/surd radical -->
		<xsl:when test="starts-with($content,'∝')"><xsl:value-of select="'\propto '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∝')"/></xsl:call-template></xsl:when>	<!--/propto R: is proportional to -->
		<xsl:when test="starts-with($content,'∞')"><xsl:value-of select="'\infty '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∞')"/></xsl:call-template></xsl:when>		<!--/infty infinity -->
<!--		<xsl:when test="starts-with($content,'&#x0221F;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0221F;')"/></xsl:call-template></xsl:when>		right (90 degree) angle -->
		<xsl:when test="starts-with($content,'∠')"><xsl:value-of select="'\angle '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∠')"/></xsl:call-template></xsl:when>		<!--/angle - angle -->
		<xsl:when test="starts-with($content,'∡')"><xsl:value-of select="'\measuredangle '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∡')"/></xsl:call-template></xsl:when>	<!--/measuredangle - angle-measured -->	<!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∢')"><xsl:value-of select="'\sphericalangle '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∢')"/></xsl:call-template></xsl:when><!--/sphericalangle angle-spherical -->	<!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∣')"><xsl:value-of select="'\mid '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∣')"/></xsl:call-template></xsl:when>		<!--/mid R: -->
		<xsl:when test="starts-with($content,'∤︀')"><xsl:value-of select="'\nshortmid '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∤︀')"/></xsl:call-template></xsl:when>	<!--/nshortmid --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∤')"><xsl:value-of select="'\nmid '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∤')"/></xsl:call-template></xsl:when>		<!--/nmid --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∥')"><xsl:value-of select="'\parallel '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∥')"/></xsl:call-template></xsl:when>	<!--/parallel R: parallel -->
		<xsl:when test="starts-with($content,'∦︀')"><xsl:value-of select="'\nshortparallel '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∦︀')"/></xsl:call-template></xsl:when>	<!--/nshortparallel N: not short par --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∦')"><xsl:value-of select="'\nparallel '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∦')"/></xsl:call-template></xsl:when>	<!--/nparallel N: not parallel --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∧')"><xsl:value-of select="'\wedge '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∧')"/></xsl:call-template></xsl:when>		<!--/wedge /land B: logical and -->
		<xsl:when test="starts-with($content,'∨')"><xsl:value-of select="'\vee '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∨')"/></xsl:call-template></xsl:when>		<!--/vee /lor B: logical or -->
		<xsl:when test="starts-with($content,'∩')"><xsl:value-of select="'\cap '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∩')"/></xsl:call-template></xsl:when>		<!--/cap B: intersection -->
		<xsl:when test="starts-with($content,'∪')"><xsl:value-of select="'\cup '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∪')"/></xsl:call-template></xsl:when>		<!--/cup B: union or logical sum -->
		<xsl:when test="starts-with($content,'∫')"><xsl:value-of select="'\int '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∫')"/></xsl:call-template></xsl:when>		<!--/int L: integral operator -->
		<xsl:when test="starts-with($content,'∬')"><xsl:value-of select="'\iint '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∬')"/></xsl:call-template></xsl:when>		<!--double integral operator --> <!-- Required amsmath -->
		<xsl:when test="starts-with($content,'∭')"><xsl:value-of select="'\iiint '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∭')"/></xsl:call-template></xsl:when>		<!--/iiint triple integral operator -->	<!-- Required amsmath -->
		<xsl:when test="starts-with($content,'∮')"><xsl:value-of select="'\oint '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∮')"/></xsl:call-template></xsl:when>		<!--/oint L: contour integral operator -->
<!--		<xsl:when test="starts-with($content,'&#x0222F;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0222F;')"/></xsl:call-template></xsl:when>-->
<!--		<xsl:when test="starts-with($content,'&#x02230;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02230;')"/></xsl:call-template></xsl:when>-->
<!--		<xsl:when test="starts-with($content,'&#x02231;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02231;')"/></xsl:call-template></xsl:when>-->
<!--		<xsl:when test="starts-with($content,'&#x02232;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02232;')"/></xsl:call-template></xsl:when>-->
<!--		<xsl:when test="starts-with($content,'&#x02233;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02233;')"/></xsl:call-template></xsl:when>-->
		<xsl:when test="starts-with($content,'∴')"><xsl:value-of select="'\therefore '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∴')"/></xsl:call-template></xsl:when>	<!--/therefore R: therefore --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'∵')"><xsl:value-of select="'\because '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∵')"/></xsl:call-template></xsl:when>	<!--/because R: because --> <!-- Required amssymb -->
<!-- ? -->	<xsl:when test="starts-with($content,'∶')"><xsl:value-of select="':'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∶')"/></xsl:call-template></xsl:when>		<!--/ratio -->
<!-- ? -->	<xsl:when test="starts-with($content,'∷')"><xsl:value-of select="'\colon\colon '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∷')"/></xsl:call-template></xsl:when>	<!--/Colon, two colons -->
<!-- ? -->	<xsl:when test="starts-with($content,'∸')"><xsl:value-of select="'\dot{-}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∸')"/></xsl:call-template></xsl:when>		<!--/dotminus B: minus sign, dot above -->
<!--		<xsl:when test="starts-with($content,'&#x02239;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02239;')"/></xsl:call-template></xsl:when>		-->
<!--		<xsl:when test="starts-with($content,'&#x0223A;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0223A;')"/></xsl:call-template></xsl:when>		minus with four dots, geometric properties -->
<!--		<xsl:when test="starts-with($content,'&#x0223B;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0223B;')"/></xsl:call-template></xsl:when>		homothetic -->
		<xsl:when test="starts-with($content,'∼')"><xsl:value-of select="'\sim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∼')"/></xsl:call-template></xsl:when>		<!--/sim R: similar -->
		<xsl:when test="starts-with($content,'∽')"><xsl:value-of select="'\backsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '∽')"/></xsl:call-template></xsl:when>	<!--/backsim R: reverse similar --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x0223E;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0223E;')"/></xsl:call-template></xsl:when>		most positive -->
<!--		<xsl:when test="starts-with($content,'&#x0223F;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0223F;')"/></xsl:call-template></xsl:when>		ac current -->
		<xsl:when test="starts-with($content,'≀')"><xsl:value-of select="'\wr '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≀')"/></xsl:call-template></xsl:when>		<!--/wr B: wreath product -->
		<xsl:when test="starts-with($content,'≁')"><xsl:value-of select="'\nsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≁')"/></xsl:call-template></xsl:when>		<!--/nsim N: not similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≂')"><xsl:value-of select="'\eqsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≂')"/></xsl:call-template></xsl:when>		<!--/esim R: equals, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≃')"><xsl:value-of select="'\simeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≃')"/></xsl:call-template></xsl:when>		<!--/simeq R: similar, equals -->
		<xsl:when test="starts-with($content,'≄')"><xsl:value-of select="'\not\simeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≄')"/></xsl:call-template></xsl:when>	<!--/nsimeq N: not similar, equals -->
		<xsl:when test="starts-with($content,'≅')"><xsl:value-of select="'\cong '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≅')"/></xsl:call-template></xsl:when>		<!--/cong R: congruent with -->
<!--		<xsl:when test="starts-with($content,'&#x02246;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02246;')"/></xsl:call-template></xsl:when>		similar, not equals -->
		<xsl:when test="starts-with($content,'≇')"><xsl:value-of select="'\ncong '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≇')"/></xsl:call-template></xsl:when>		<!--/ncong N: not congruent with --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≈')"><xsl:value-of select="'\approx '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≈')"/></xsl:call-template></xsl:when>	<!--/approx R: approximate -->
<!--		<xsl:when test="starts-with($content,'&#x02249;&#x00338;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02249;&#x00338;')"/></xsl:call-template></xsl:when>	not, vert, approximate -->
		<xsl:when test="starts-with($content,'≉')"><xsl:value-of select="'\not\approx '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≉')"/></xsl:call-template></xsl:when>	<!--/napprox N: not approximate -->
		<xsl:when test="starts-with($content,'≊')"><xsl:value-of select="'\approxeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≊')"/></xsl:call-template></xsl:when>	<!--/approxeq R: approximate, equals --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x0224B;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0224B;')"/></xsl:call-template></xsl:when>		approximately identical to -->
<!--		<xsl:when test="starts-with($content,'&#x0224C;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0224C;')"/></xsl:call-template></xsl:when>		/backcong R: reverse congruent -->
		<xsl:when test="starts-with($content,'≍')"><xsl:value-of select="'\asymp '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≍')"/></xsl:call-template></xsl:when>		<!--/asymp R: asymptotically equal to -->
		<xsl:when test="starts-with($content,'≎')"><xsl:value-of select="'\Bumpeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≎')"/></xsl:call-template></xsl:when>	<!--/Bumpeq R: bumpy equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≏')"><xsl:value-of select="'\bumpeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≏')"/></xsl:call-template></xsl:when>	<!--/bumpeq R: bumpy equals, equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≐')"><xsl:value-of select="'\doteq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≐')"/></xsl:call-template></xsl:when>		<!--/doteq R: equals, single dot above -->
		<xsl:when test="starts-with($content,'≑')"><xsl:value-of select="'\doteqdot '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≑')"/></xsl:call-template></xsl:when>	<!--/doteqdot /Doteq R: eq, even dots --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≒')"><xsl:value-of select="'\fallingdotseq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≒')"/></xsl:call-template></xsl:when>	<!--/fallingdotseq R: eq, falling dots --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≓')"><xsl:value-of select="'\risingdotseq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≓')"/></xsl:call-template></xsl:when>	<!--/risingdotseq R: eq, rising dots --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x02254;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02254;')"/></xsl:call-template></xsl:when>		/coloneq R: colon, equals -->
<!--		<xsl:when test="starts-with($content,'&#x02255;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02255;')"/></xsl:call-template></xsl:when>		/eqcolon R: equals, colon -->
		<xsl:when test="starts-with($content,'≖')"><xsl:value-of select="'\eqcirc '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≖')"/></xsl:call-template></xsl:when>	<!--/eqcirc R: circle on equals sign --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≗')"><xsl:value-of select="'\circeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≗')"/></xsl:call-template></xsl:when>	<!--/circeq R: circle, equals --> <!-- Required amssymb -->
<!-- ? -->	<xsl:when test="starts-with($content,'≘')"><xsl:value-of select="'\stackrel{\frown}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≘')"/></xsl:call-template></xsl:when>
<!-- ? -->	<xsl:when test="starts-with($content,'≙')"><xsl:value-of select="'\stackrel{\wedge}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≙')"/></xsl:call-template></xsl:when>	<!--/wedgeq R: corresponds to (wedge, equals) -->
<!-- ? -->	<xsl:when test="starts-with($content,'≚')"><xsl:value-of select="'\stackrel{\vee}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≚')"/></xsl:call-template></xsl:when>	<!--logical or, equals -->
<!-- ? -->	<xsl:when test="starts-with($content,'≛')"><xsl:value-of select="'\stackrel{\star}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≛')"/></xsl:call-template></xsl:when>	<!--equal, asterisk above -->
		<xsl:when test="starts-with($content,'≜')"><xsl:value-of select="'\triangleq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≜')"/></xsl:call-template></xsl:when>	<!--/triangleq R: triangle, equals --> <!-- Required amssymb -->
<!-- ? -->	<xsl:when test="starts-with($content,'≝')"><xsl:value-of select="'\stackrel{\scriptscriptstyle\mathrm{def}}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≝')"/></xsl:call-template></xsl:when>
<!-- ? -->	<xsl:when test="starts-with($content,'≞')"><xsl:value-of select="'\stackrel{\scriptscriptstyle\mathrm{m}}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≞')"/></xsl:call-template></xsl:when>
<!-- ? -->	<xsl:when test="starts-with($content,'≟')"><xsl:value-of select="'\stackrel{?}{=}'"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≟')"/></xsl:call-template></xsl:when>	<!--/questeq R: equal with questionmark -->
<!--		<xsl:when test="starts-with($content,'&#x02260;&#x0FE00;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02260;&#x0FE00;')"/></xsl:call-template></xsl:when>	not equal, dot -->
		<xsl:when test="starts-with($content,'≠')"><xsl:value-of select="'\ne '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≠')"/></xsl:call-template></xsl:when>		<!--/ne /neq R: not equal -->
<!--		<xsl:when test="starts-with($content,'&#x02261;&#x020E5;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02261;&#x020E5;')"/></xsl:call-template></xsl:when>	reverse not equivalent -->
		<xsl:when test="starts-with($content,'≡')"><xsl:value-of select="'\equiv '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≡')"/></xsl:call-template></xsl:when>		<!--/equiv R: identical with -->
		<xsl:when test="starts-with($content,'≢')"><xsl:value-of select="'\not\equiv '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≢')"/></xsl:call-template></xsl:when>	<!--/nequiv N: not identical with -->
<!--		<xsl:when test="starts-with($content,'&#x02263;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x02263;')"/></xsl:call-template></xsl:when>		-->
		<xsl:when test="starts-with($content,'≤')"><xsl:value-of select="'\le '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≤')"/></xsl:call-template></xsl:when>		<!--/leq /le R: less-than-or-equal -->
		<xsl:when test="starts-with($content,'≥')"><xsl:value-of select="'\ge '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≥')"/></xsl:call-template></xsl:when>		<!--/geq /ge R: greater-than-or-equal -->
		<xsl:when test="starts-with($content,'≦')"><xsl:value-of select="'\leqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≦')"/></xsl:call-template></xsl:when>		<!--/leqq R: less, double equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≧')"><xsl:value-of select="'\geqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≧')"/></xsl:call-template></xsl:when>		<!--/geqq R: greater, double equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≨')"><xsl:value-of select="'\lneqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≨')"/></xsl:call-template></xsl:when>		<!--/lneqq N: less, not double equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≩')"><xsl:value-of select="'\gneqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≩')"/></xsl:call-template></xsl:when>		<!--/gneqq N: greater, not dbl equals --> <!-- Required amssymb -->
<!--		<xsl:when test="starts-with($content,'&#x0226A;&#x00338;&#x0FE00;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0226A;&#x00338;&#x0FE00;')"/></xsl:call-template></xsl:when>	not much less than, variant -->
<!--		<xsl:when test="starts-with($content,'&#x0226A;&#x00338;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0226A;&#x00338;')"/></xsl:call-template></xsl:when>	not, vert, much less than -->
		<xsl:when test="starts-with($content,'≪')"><xsl:value-of select="'\ll '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≪')"/></xsl:call-template></xsl:when>		<!--/ll R: double less-than sign -->
<!--		<xsl:when test="starts-with($content,'&#x0226B;&#x00338;&#x0FE00;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0226B;&#x00338;&#x0FE00;')"/></xsl:call-template></xsl:when>	not much greater than, variant -->
<!--		<xsl:when test="starts-with($content,'&#x0226B;&#x00338;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x0226B;&#x00338;')"/></xsl:call-template></xsl:when>	not, vert, much greater than -->
		<xsl:when test="starts-with($content,'≫')"><xsl:value-of select="'\gg '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≫')"/></xsl:call-template></xsl:when>		<!--/gg R: dbl greater-than sign -->
		<xsl:when test="starts-with($content,'≬')"><xsl:value-of select="'\between '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≬')"/></xsl:call-template></xsl:when>	<!--/between R: between --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≭')"><xsl:value-of select="'\not\asymp '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≭')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,'≮')"><xsl:value-of select="'\nless '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≮')"/></xsl:call-template></xsl:when>		<!--/nless N: not less-than --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≯')"><xsl:value-of select="'\ngtr '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≯')"/></xsl:call-template></xsl:when>		<!--/ngtr N: not greater-than --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≰⃥')"><xsl:value-of select="'\nleq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≰⃥')"/></xsl:call-template></xsl:when>	<!--/nleq N: not less-than-or-equal --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≰')"><xsl:value-of select="'\nleqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≰')"/></xsl:call-template></xsl:when>		<!--/nleqq N: not less, dbl equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≱⃥')"><xsl:value-of select="'\ngeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≱⃥')"/></xsl:call-template></xsl:when>	<!--/ngeq N: not greater-than-or-equal --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≱')"><xsl:value-of select="'\ngeqq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≱')"/></xsl:call-template></xsl:when>		<!--/ngeqq N: not greater, dbl equals --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≲')"><xsl:value-of select="'\lesssim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≲')"/></xsl:call-template></xsl:when>	<!--/lesssim R: less, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≳')"><xsl:value-of select="'\gtrsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≳')"/></xsl:call-template></xsl:when>	<!--/gtrsim R: greater, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≴')"><xsl:value-of select="'\not\lesssim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≴')"/></xsl:call-template></xsl:when>	<!--not less, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≵')"><xsl:value-of select="'\not\gtrsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≵')"/></xsl:call-template></xsl:when>	<!--not greater, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≶')"><xsl:value-of select="'\lessgtr '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≶')"/></xsl:call-template></xsl:when>	<!--/lessgtr R: less, greater --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≷')"><xsl:value-of select="'\gtrless '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≷')"/></xsl:call-template></xsl:when>	<!--/gtrless R: greater, less --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≸')"><xsl:value-of select="'\not\lessgtr '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≸')"/></xsl:call-template></xsl:when>	<!--not less, greater --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≹')"><xsl:value-of select="'\not\gtrless '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≹')"/></xsl:call-template></xsl:when>	<!--not greater, less --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≺')"><xsl:value-of select="'\prec '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≺')"/></xsl:call-template></xsl:when>		<!--/prec R: precedes -->
		<xsl:when test="starts-with($content,'≻')"><xsl:value-of select="'\succ '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≻')"/></xsl:call-template></xsl:when>		<!--/succ R: succeeds -->
		<xsl:when test="starts-with($content,'≼')"><xsl:value-of select="'\preccurlyeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≼')"/></xsl:call-template></xsl:when>	<!--/preccurlyeq R: precedes, curly eq --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≽')"><xsl:value-of select="'\succcurlyeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≽')"/></xsl:call-template></xsl:when>	<!--/succcurlyeq R: succeeds, curly eq --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≾')"><xsl:value-of select="'\precsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≾')"/></xsl:call-template></xsl:when>	<!--/precsim R: precedes, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'≿')"><xsl:value-of select="'\succsim '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '≿')"/></xsl:call-template></xsl:when>	<!--/succsim R: succeeds, similar --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⊀')"><xsl:value-of select="'\nprec '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊀')"/></xsl:call-template></xsl:when>		<!--/nprec N: not precedes --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⊁')"><xsl:value-of select="'\nsucc '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊁')"/></xsl:call-template></xsl:when>		<!--/nsucc N: not succeeds --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⊂')"><xsl:value-of select="'\subset '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊂')"/></xsl:call-template></xsl:when>	<!--/subset R: subset or is implied by -->
		<xsl:when test="starts-with($content,'⊃')"><xsl:value-of select="'\supset '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊃')"/></xsl:call-template></xsl:when>	<!--/supset R: superset or implies -->
		<xsl:when test="starts-with($content,'⊄')"><xsl:value-of select="'\not\subset '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊄')"/></xsl:call-template></xsl:when>	<!--not subset -->
		<xsl:when test="starts-with($content,'⊅')"><xsl:value-of select="'\not\supset '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊅')"/></xsl:call-template></xsl:when>	<!--not superset -->
		<xsl:when test="starts-with($content,'⊆')"><xsl:value-of select="'\subseteq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊆')"/></xsl:call-template></xsl:when>	<!--/subseteq R: subset, equals -->
		<xsl:when test="starts-with($content,'⊇')"><xsl:value-of select="'\supseteq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊇')"/></xsl:call-template></xsl:when>	<!--/supseteq R: superset, equals -->
		<xsl:when test="starts-with($content,'⊎')"><xsl:value-of select="'\uplus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊎')"/></xsl:call-template></xsl:when>		<!--/uplus B: plus sign in union -->
		<xsl:when test="starts-with($content,'⊓')"><xsl:value-of select="'\sqcap '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊓')"/></xsl:call-template></xsl:when>		<!--/sqcap B: square intersection -->
		<xsl:when test="starts-with($content,'⊔')"><xsl:value-of select="'\bigsqcup '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊔')"/></xsl:call-template></xsl:when>		<!--/sqcup B: square union -->
		<xsl:when test="starts-with($content,'⊕')"><xsl:value-of select="'\oplus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊕')"/></xsl:call-template></xsl:when>		<!--/oplus B: plus sign in circle -->
		<xsl:when test="starts-with($content,'⊖')"><xsl:value-of select="'\ominus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊖')"/></xsl:call-template></xsl:when>	<!--/ominus B: minus sign in circle -->
		<xsl:when test="starts-with($content,'⊗')"><xsl:value-of select="'\otimes '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊗')"/></xsl:call-template></xsl:when>	<!--/otimes B: multiply sign in circle -->
		<xsl:when test="starts-with($content,'⊘')"><xsl:value-of select="'\oslash '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊘')"/></xsl:call-template></xsl:when>	<!--/oslash B: solidus in circle -->
<!-- ? -->	<xsl:when test="starts-with($content,'⊙')"><xsl:value-of select="'\odot '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊙')"/></xsl:call-template></xsl:when>		<!--/odot B: middle dot in circle --> <!--/bigodot L: circle dot operator -->
		<xsl:when test="starts-with($content,'⊟')"><xsl:value-of select="'\boxminus '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊟')"/></xsl:call-template></xsl:when>	<!--/boxminus B: minus sign in box --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⊤')"><xsl:value-of select="'\top '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊤')"/></xsl:call-template></xsl:when>		<!--/top top -->
		<xsl:when test="starts-with($content,'⊥')"><xsl:value-of select="'\perp '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊥')"/></xsl:call-template></xsl:when>		<!--/perp R: perpendicular --><!--/bot bottom -->
		<xsl:when test="starts-with($content,'⊦')"><xsl:value-of select="'\vdash '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊦')"/></xsl:call-template></xsl:when>		<!--/vdash R: vertical, dash -->
		<xsl:when test="starts-with($content,'⊧')"><xsl:value-of select="'\vDash '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊧')"/></xsl:call-template></xsl:when>		<!--/vDash R: vertical, dbl dash --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⊨')"><xsl:value-of select="'\models '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊨')"/></xsl:call-template></xsl:when>	<!--/models R: -->
		<xsl:when test="starts-with($content,'⊪')"><xsl:value-of select="'\Vvdash '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⊪')"/></xsl:call-template></xsl:when>	<!--/Vvdash R: triple vertical, dash --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⋀')"><xsl:value-of select="'\bigwedge '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋀')"/></xsl:call-template></xsl:when>	<!--/bigwedge L: logical or operator -->
		<xsl:when test="starts-with($content,'⋁')"><xsl:value-of select="'\bigvee '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋁')"/></xsl:call-template></xsl:when>	<!--/bigcap L: intersection operator -->
		<xsl:when test="starts-with($content,'⋂')"><xsl:value-of select="'\bigcap '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋂')"/></xsl:call-template></xsl:when>	<!--/bigvee L: logical and operator -->
		<xsl:when test="starts-with($content,'⋃')"><xsl:value-of select="'\bigcup '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋃')"/></xsl:call-template></xsl:when>	<!--/bigcup L: union operator -->
		<xsl:when test="starts-with($content,'⋄')"><xsl:value-of select="'\diamond '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋄')"/></xsl:call-template></xsl:when>	<!--/diamond B: open diamond -->
		<xsl:when test="starts-with($content,'⋅')"><xsl:value-of select="'\cdot '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋅')"/></xsl:call-template></xsl:when>		<!--/cdot B: small middle dot -->
		<xsl:when test="starts-with($content,'⋆')"><xsl:value-of select="'\star '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋆')"/></xsl:call-template></xsl:when>		<!--/star B: small star, filled -->
		<xsl:when test="starts-with($content,'⋇')"><xsl:value-of select="'\divideontimes '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋇')"/></xsl:call-template></xsl:when>	<!--/divideontimes B: division on times --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⋈')"><xsl:value-of select="'\bowtie '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋈')"/></xsl:call-template></xsl:when>	<!--/bowtie R: -->
		<xsl:when test="starts-with($content,'⋍')"><xsl:value-of select="'\backsimeq '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋍')"/></xsl:call-template></xsl:when>	<!--/backsimeq R: reverse similar, eq --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'⋯')"><xsl:value-of select="'\cdots '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋯')"/></xsl:call-template></xsl:when>		<!--/cdots, three dots, centered -->
<!--		<xsl:when test="starts-with($content,'&#x022F0;')"><xsl:value-of select="' '" /><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&#x022F0;')"/></xsl:call-template></xsl:when>		three dots, ascending -->
		<xsl:when test="starts-with($content,'⋱')"><xsl:value-of select="'\ddots '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⋱')"/></xsl:call-template></xsl:when>		<!--/ddots, three dots, descending -->

<!-- ====================================================================== -->
<!-- 	Unicode 3.2
	Miscellaneous Technical
	Range: 2300-23FF
	http://www.unicode.org/charts/PDF/U2300.pdf                         -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'⌈')"><xsl:value-of select="'\lceil '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⌈')"/></xsl:call-template></xsl:when>	<!--/lceil O: left ceiling -->
		<xsl:when test="starts-with($content,'⌉')"><xsl:value-of select="'\rceil '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⌉')"/></xsl:call-template></xsl:when>	<!--/rceil C: right ceiling -->
		<xsl:when test="starts-with($content,'⌊')"><xsl:value-of select="'\lfloor '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⌊')"/></xsl:call-template></xsl:when>	<!--/lfloor O: left floor -->
		<xsl:when test="starts-with($content,'⌋')"><xsl:value-of select="'\rfloor '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '⌋')"/></xsl:call-template></xsl:when>	<!--/rfloor C: right floor -->
		<xsl:when test="starts-with($content,'〈')"><xsl:value-of select="'\langle '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '〈')"/></xsl:call-template></xsl:when>	<!--/langle O: left angle bracket -->
		<xsl:when test="starts-with($content,'〉')"><xsl:value-of select="'\rangle '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '〉')"/></xsl:call-template></xsl:when>	<!--/rangle O: right angle bracket -->
<!-- ====================================================================== -->
		<xsl:when test="starts-with($content,'□')"><xsl:value-of select="'\square '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '□')"/></xsl:call-template></xsl:when>	<!--/square, square --> <!-- Required amssymb -->
		<xsl:when test="starts-with($content,'▪')"><xsl:value-of select="'\blacksquare '"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '▪')"/></xsl:call-template></xsl:when>	<!--/blacksquare, square, filled  --> <!-- Required amssymb -->

		<xsl:when test="starts-with($content,&quot;'&quot;)"><xsl:value-of select="&quot;\text{'}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, &quot;'&quot;)"/></xsl:call-template></xsl:when><!-- \text required amslatex -->

		<xsl:when test="starts-with($content,&quot;{&quot;)"><xsl:value-of select="&quot;\{&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '{')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;}&quot;)"><xsl:value-of select="&quot;\}&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '}')"/></xsl:call-template></xsl:when>

<!--- special characters -->
		<xsl:when test="starts-with($content,&quot;$&quot;)"><xsl:value-of select="&quot;\$&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '$')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;#&quot;)"><xsl:value-of select="&quot;\#&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '#')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;&amp;&quot;)"><xsl:value-of select="&quot;\&amp;&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '&amp;')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;%&quot;)"><xsl:value-of select="&quot;\%&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '%')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;_&quot;)"><xsl:value-of select="&quot;\_&quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '_')"/></xsl:call-template></xsl:when>
		<xsl:when test="starts-with($content,&quot;\&quot;)"><xsl:value-of select="&quot;\backslash &quot;"/><xsl:call-template name="replaceEntities"><xsl:with-param name="content" select="substring-after($content, '\')"/></xsl:call-template></xsl:when>

		<xsl:otherwise>
			<xsl:value-of select="substring($content,1,1)"/>
			<xsl:call-template name="replaceEntities">
				<xsl:with-param name="content" select="substring($content, 2)"/>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose></xsl:if>
</xsl:template><xsl:template name="replaceMtextEntities">
	<xsl:param name="content"/>
	<xsl:if test="string-length($content)&gt;0">
		<xsl:choose>
			<xsl:when test="starts-with($content,'   ')"><xsl:value-of select="&quot;\hspace{0.28em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '   ')"/></xsl:call-template></xsl:when> <!-- ThickSpace - space of width 5/18 em -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.5em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> <!-- en space (1/2-em) -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{1em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> <!-- emsp - space of width 1em -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.33em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> <!-- emsp13 - space of width 1/3 em -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.25em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> <!-- ThickSpace - space of width 1/4 em -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.17em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when> <!-- ThinSpace - space of width 3/18 em -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.05em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,'​')"><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '​')"/></xsl:call-template></xsl:when>	<!--zero width space -->
			<xsl:when test="starts-with($content,' ')"><xsl:value-of select="&quot;\hspace{0.22em}&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, ' ')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;$&quot;)"><xsl:value-of select="&quot;\$&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '$')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;#&quot;)"><xsl:value-of select="&quot;\#&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '#')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;&amp;&quot;)"><xsl:value-of select="&quot;\&amp;&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '&amp;')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;%&quot;)"><xsl:value-of select="&quot;\%&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '%')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;_&quot;)"><xsl:value-of select="&quot;\_&quot;"/><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '_')"/></xsl:call-template></xsl:when>
			<xsl:when test="starts-with($content,&quot;\&quot;)"><xsl:call-template name="replaceMtextEntities"><xsl:with-param name="content" select="substring-after($content, '\')"/></xsl:call-template></xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="substring($content,1,1)"/>
				<xsl:call-template name="replaceMtextEntities">
					<xsl:with-param name="content" select="substring($content, 2)"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:if>
</xsl:template>
<xsl:template match="m:cn"><xsl:apply-templates/></xsl:template><xsl:template match="m:cn[@type='complex-cartesian']">
	<xsl:apply-templates select="text()[1]"/>
  	<xsl:text>+</xsl:text>
	<xsl:apply-templates select="text()[2]"/>
	<xsl:text>i</xsl:text>
</xsl:template><xsl:template match="m:cn[@type='rational']">
	<xsl:apply-templates select="text()[1]"/>
	<xsl:text>/</xsl:text>
	<xsl:apply-templates select="text()[2]"/>
</xsl:template><xsl:template match="m:cn[@type='integer' and @base!=10]">
		<xsl:apply-templates/>
		<xsl:text>_{</xsl:text><xsl:value-of select="@base"/><xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:cn[@type='complex-polar']">
	<xsl:apply-templates select="text()[1]"/>
	<xsl:text>e^{i </xsl:text>
	<xsl:apply-templates select="text()[2]"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:cn[@type='e-notation']">
    <xsl:apply-templates select="text()[1]"/>
    <xsl:text>E</xsl:text>
    <xsl:apply-templates select="text()[2]"/>
</xsl:template><xsl:template match="m:ci | m:csymbol">
	<xsl:choose>
		<xsl:when test="string-length(normalize-space(text()))&gt;1">
			<xsl:text>\mathrm{</xsl:text><xsl:apply-templates/><xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise><xsl:apply-templates/></xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:apply | m:reln">
	<xsl:apply-templates select="*[1]">
	<!-- <? -->
		<xsl:with-param name="p" select="10"/>
	</xsl:apply-templates>
	<!-- ?> -->
 	<xsl:text>(</xsl:text>
	<xsl:for-each select="*[position()&gt;1]">
		<xsl:apply-templates select="."/>
		<xsl:if test="not(position()=last())"><xsl:text>, </xsl:text></xsl:if>
	</xsl:for-each>
 	<xsl:text>)</xsl:text>
</xsl:template><xsl:template match="m:fn[m:apply[1]]"> <!-- for m:fn using default rule -->
	<xsl:text>(</xsl:text><xsl:apply-templates/><xsl:text>)</xsl:text>
</xsl:template><xsl:template match="m:interval[*[2]]">
	<xsl:choose>
		<xsl:when test="@closure='open' or @closure='open-closed'">
			<xsl:text>\left(</xsl:text>
		</xsl:when>
		<xsl:otherwise><xsl:text>\left[</xsl:text></xsl:otherwise>
	</xsl:choose>
	<xsl:apply-templates select="*[1]"/>
	<xsl:text> , </xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:choose>
		<xsl:when test="@closure='open' or @closure='closed-open'">
			<xsl:text>\right)</xsl:text>
		</xsl:when>
		<xsl:otherwise><xsl:text>\right]</xsl:text></xsl:otherwise>
	</xsl:choose>
</xsl:template><xsl:template match="m:interval">
	<xsl:text>\left\{</xsl:text><xsl:apply-templates/><xsl:text>\right\}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:inverse]]">
	<xsl:apply-templates select="*[2]"/><xsl:text>^{(-1)}</xsl:text>
</xsl:template><xsl:template match="m:sep | m:condition"><xsl:apply-templates/></xsl:template><xsl:template match="m:lambda">
	<xsl:apply-templates select="m:bvar/*"/>
  <xsl:text>\mapsto </xsl:text>
  <xsl:apply-templates select="*[last()]"/>
<!--	Other variant
	<xsl:text>\mathrm{lambda}\: </xsl:text>
  	<xsl:apply-templates select="m:bvar/*"/>
  	<xsl:text>.\: </xsl:text>
  <xsl:apply-templates select="*[last()]"/> -->
</xsl:template><xsl:template match="m:apply[*[1][self::m:compose]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\circ </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:ident"><xsl:text>\mathrm{id}</xsl:text></xsl:template><xsl:template match="m:domain | m:codomain | m:image | m:arg | m:lcm | m:grad |          m:curl | m:median | m:mode">
	<xsl:text>\mathop{\mathrm{</xsl:text>
	<xsl:value-of select="local-name()"/>
	<xsl:text>}}</xsl:text>
</xsl:template><xsl:template match="m:domainofapplication"/><xsl:template match="m:piecewise">
	<xsl:text>\begin{cases}</xsl:text>
	<xsl:apply-templates select="m:piece"/>
	<xsl:apply-templates select="m:otherwise"/>
	<xsl:text>\end{cases}</xsl:text>
</xsl:template><xsl:template match="m:piece">
		<xsl:apply-templates select="*[1]"/>
		<xsl:text> &amp; \text{if $</xsl:text>
		<xsl:apply-templates select="*[2]"/>
		<xsl:text>$}</xsl:text>
		<xsl:if test="not(position()=last()) or ../m:otherwise"><xsl:text>\\ </xsl:text></xsl:if>
</xsl:template><xsl:template match="m:otherwise">
	<xsl:apply-templates select="*[1]"/>
	<xsl:text> &amp; \text{otherwise}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:quotient]]">
	<xsl:text>\left\lfloor\frac{</xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>}{</xsl:text>
	<xsl:apply-templates select="*[3]"/>
	<xsl:text>}\right\rfloor </xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:factorial]]">
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
	<xsl:text>!</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:divide]]">
	<xsl:param name="p" select="0"/>
  <xsl:param name="this-p" select="3"/>
  <xsl:if test="$this-p &lt; $p"><xsl:text>\left(</xsl:text></xsl:if>
  <xsl:text>\frac{</xsl:text>
	<xsl:apply-templates select="*[2]"/>
<!--		<xsl:with-param name="p" select="$this-p"/>
	</xsl:apply-templates>-->
	<xsl:text>}{</xsl:text>
	<xsl:apply-templates select="*[3]"/>
<!--    	<xsl:with-param name="p" select="$this-p"/>
	</xsl:apply-templates>-->
	<xsl:text>}</xsl:text>
	<xsl:if test="$this-p &lt; $p"><xsl:text>\right)</xsl:text></xsl:if>
</xsl:template><xsl:template match="m:apply[*[1][self::m:max or self::m:min]]">
	<xsl:text>\</xsl:text>
	<xsl:value-of select="local-name(*[1])"/>
	<xsl:text>\{</xsl:text>
   <xsl:choose>
		<xsl:when test="m:condition">
   		<xsl:apply-templates select="*[last()]"/>
   		<xsl:text>\mid </xsl:text>
			<xsl:apply-templates select="m:condition/node()"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:for-each select="*[position() &gt; 1]">
				<xsl:apply-templates select="."/>
				<xsl:if test="position() !=last()"><xsl:text> , </xsl:text></xsl:if>
			</xsl:for-each>
		</xsl:otherwise>
   </xsl:choose>
	<xsl:text>\}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:minus] and count(*)=2]">
	<xsl:text>-</xsl:text>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="5"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:apply[*[1][self::m:minus] and count(*)&gt;2]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo">-</xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="2"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:plus]]">
  <xsl:param name="p" select="0"/>
  <xsl:if test="$p &gt; 2">
		<xsl:text>(</xsl:text>
	</xsl:if>
  <xsl:for-each select="*[position()&gt;1]">
   <xsl:if test="position() &gt; 1">
    <xsl:choose>
      <xsl:when test="self::m:apply[*[1][self::m:times] and       *[2][self::m:apply/*[1][self::m:minus] or self::m:cn[not(m:sep) and       (number(.) &lt; 0)]]]">-</xsl:when>
      <xsl:otherwise>+</xsl:otherwise>
    </xsl:choose>
   </xsl:if>
    <xsl:choose>
      <xsl:when test="self::m:apply[*[1][self::m:times] and       *[2][self::m:cn[not(m:sep) and (number(.) &lt;0)]]]">
			<xsl:value-of select="-(*[2])"/>
			<xsl:apply-templates select=".">
		     <xsl:with-param name="first" select="2"/>
		     <xsl:with-param name="p" select="2"/>
		   </xsl:apply-templates>
       </xsl:when>
      <xsl:when test="self::m:apply[*[1][self::m:times] and       *[2][self::m:apply/*[1][self::m:minus]]]">
				<xsl:apply-templates select="./*[2]/*[2]"/>
				<xsl:apply-templates select=".">
					<xsl:with-param name="first" select="2"/>
					<xsl:with-param name="p" select="2"/>
				</xsl:apply-templates>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select=".">
					<xsl:with-param name="p" select="2"/>
				</xsl:apply-templates>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:for-each>
	<xsl:if test="$p &gt; 2">
		<xsl:text>)</xsl:text>
	</xsl:if>
</xsl:template><xsl:template match="m:apply[*[1][self::m:power]]">
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="5"/>
	</xsl:apply-templates>
	<xsl:text>^{</xsl:text>
	<xsl:apply-templates select="*[3]">
		<xsl:with-param name="p" select="5"/>
	</xsl:apply-templates>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:rem]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo">\mod </xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="3"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:times]]" name="times">
  <xsl:param name="p" select="0"/>
  <xsl:param name="first" select="1"/>
  <xsl:if test="$p &gt; 3"><xsl:text>(</xsl:text></xsl:if>
  <xsl:for-each select="*[position()&gt;1]">
		<xsl:if test="position() &gt; 1">
			<xsl:choose>
				<xsl:when test="self::m:cn">\times <!-- times --></xsl:when>
				<xsl:otherwise><!--invisible times--></xsl:otherwise>
			</xsl:choose>
		</xsl:if>
		<xsl:if test="position()&gt;= $first">
			<xsl:apply-templates select=".">
				<xsl:with-param name="p" select="3"/>
			</xsl:apply-templates>
		</xsl:if>
	</xsl:for-each>
  <xsl:if test="$p &gt; 3"><xsl:text>)</xsl:text></xsl:if>
</xsl:template><xsl:template match="m:apply[*[1][self::m:root]]">
	<xsl:text>\sqrt</xsl:text>
	<xsl:if test="m:degree!=2">
		<xsl:text>[</xsl:text>
		<xsl:apply-templates select="m:degree/*"/>
		<xsl:text>]</xsl:text>
	</xsl:if>
	<xsl:text>{</xsl:text>
	<xsl:apply-templates select="*[position()&gt;1 and not(self::m:degree)]"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:gcd"><xsl:text>\gcd </xsl:text></xsl:template><xsl:template match="m:apply[*[1][self::m:and]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\land <!-- and --></xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:or]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="3"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\lor </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:xor]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="3"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\mathop{\mathrm{xor}}</xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:not]]">
	<xsl:text>\neg </xsl:text>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:apply[*[1][self::m:implies]] | m:reln[*[1][self::m:implies]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo">\implies </xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="3"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:forall or self::m:exists]]">
	<xsl:text>\</xsl:text>
	<xsl:value-of select="local-name(*[1])"/>
	<xsl:text> </xsl:text>
	<xsl:apply-templates select="m:bvar"/>
	<xsl:if test="m:condition">
		<xsl:text>, </xsl:text><xsl:apply-templates select="m:condition"/>
	</xsl:if>
	<xsl:if test="*[last()][local-name()!='condition'][local-name()!='bvar']">
		<xsl:text>\colon </xsl:text>
	  <xsl:apply-templates select="*[last()]"/>
  </xsl:if>
</xsl:template><xsl:template match="m:apply[*[1][self::m:abs]]">
	<xsl:text>\left|</xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>\right|</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:conjugate]]">
	<xsl:text>\overline{</xsl:text><xsl:apply-templates select="*[2]"/><xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:real"><xsl:text>\Re </xsl:text></xsl:template><xsl:template match="m:imaginary"><xsl:text>\Im </xsl:text></xsl:template><xsl:template match="m:apply[*[1][self::m:floor]]">
	<xsl:text>\lfloor </xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>\rfloor </xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:ceiling]]">
	<xsl:text>\lceil </xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>\rceil </xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:eq]] | m:reln[*[1][self::m:eq]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">=</xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:neq]] | m:reln[*[1][self::m:neq]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\neq </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:gt]] | m:reln[*[1][self::m:gt]]">
<xsl:param name="p" select="0"/>
<xsl:call-template name="infix">
	<xsl:with-param name="this-p" select="1"/>
	<xsl:with-param name="p" select="$p"/>
	<xsl:with-param name="mo">&gt; </xsl:with-param>
</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:lt]] | m:reln[*[1][self::m:lt]]">
<xsl:param name="p" select="0"/>
<xsl:call-template name="infix">
	<xsl:with-param name="this-p" select="1"/>
	<xsl:with-param name="p" select="$p"/>
	<xsl:with-param name="mo">&lt; </xsl:with-param>
</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:geq]] | m:reln[*[1][self::m:geq]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\ge </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:leq]] | m:reln[*[1][self::m:leq]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\le </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:equivalent]] | m:reln[*[1][self::m:equivalent]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\equiv </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:approx]] | m:reln[*[1][self::m:approx]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="1"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\approx </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:factorof]] | m:reln[*[1][self::m:factorof]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo"> | </xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="3"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:int]]">
	<xsl:text>\int</xsl:text>
	<xsl:if test="m:lowlimit/*|m:interval/*[1]|m:condition/*">
		<xsl:text>_{</xsl:text>
		<xsl:apply-templates select="m:lowlimit/*|m:interval/*[1]|m:condition/*"/>
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="m:uplimit/*|m:interval/*[2]">
		<xsl:text>^{</xsl:text>
		<xsl:apply-templates select="m:uplimit/*|m:interval/*[2]"/>
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:text> </xsl:text>
	<xsl:apply-templates select="*[last()]"/>
	<xsl:text>\,d </xsl:text>
	<xsl:apply-templates select="m:bvar"/>
</xsl:template><xsl:template match="m:apply[*[1][self::m:diff] and m:ci and count(*)=2]" priority="2">
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>^\prime </xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:diff]]" priority="1">
	<xsl:text>\frac{</xsl:text>
	<xsl:choose>
		<xsl:when test="m:bvar/m:degree">
			<xsl:text>d^{</xsl:text>
			<xsl:apply-templates select="m:bvar/m:degree/node()"/>
			<xsl:text>}</xsl:text>
			<xsl:apply-templates select="*[last()]"/>
			<xsl:text>}{d</xsl:text>
			<xsl:apply-templates select="m:bvar/node()"/>
			<xsl:text>^{</xsl:text>
			<xsl:apply-templates select="m:bvar/m:degree/node()"/>
			<xsl:text>}</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<xsl:text>d </xsl:text>
			<xsl:apply-templates select="*[last()]"/>
			<xsl:text>}{d </xsl:text>
			<xsl:apply-templates select="m:bvar"/>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:partialdiff] and m:list and m:ci and count(*)=3]" priority="2">
	<xsl:text>D_{</xsl:text>
	<xsl:for-each select="m:list[1]/*">
		<xsl:apply-templates select="."/>
		<xsl:if test="position()&lt;last()"><xsl:text>, </xsl:text></xsl:if>
	</xsl:for-each>
	<xsl:text>}</xsl:text>
	<xsl:apply-templates select="*[3]"/>
</xsl:template><xsl:template match="m:apply[*[1][self::m:partialdiff]]" priority="1">
	<xsl:text>\frac{\partial^{</xsl:text>
	<xsl:choose>
		<xsl:when test="m:degree">
			<xsl:apply-templates select="m:degree/node()"/>
		</xsl:when>
		<xsl:when test="m:bvar/m:degree[string(number(.))='NaN']">
			<xsl:for-each select="m:bvar/m:degree">
				<xsl:apply-templates select="node()"/>
				<xsl:if test="position()&lt;last()"><xsl:text>+</xsl:text></xsl:if>
			</xsl:for-each>
			<xsl:if test="count(m:bvar[not(m:degree)])&gt;0">
				<xsl:text>+</xsl:text>
				<xsl:value-of select="count(m:bvar[not(m:degree)])"/>
			</xsl:if>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="sum(m:bvar/m:degree)+count(m:bvar[not(m:degree)])"/>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:text>}</xsl:text>
	<xsl:apply-templates select="*[last()]"/>
	<xsl:text>}{</xsl:text>
	<xsl:for-each select="m:bvar">
		<xsl:text>\partial </xsl:text>
		<xsl:apply-templates select="node()"/>
		<xsl:if test="m:degree">
			<xsl:text>^{</xsl:text>
			<xsl:apply-templates select="m:degree/node()"/>
			<xsl:text>}</xsl:text>
		</xsl:if>
	</xsl:for-each>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:declare | m:lowlimit | m:uplimit | m:degree | m:momentabout"/><xsl:template match="m:bvar">
	<xsl:apply-templates/>
	<xsl:if test="following-sibling::m:bvar"><xsl:text>, </xsl:text></xsl:if>
</xsl:template><xsl:template match="m:divergence"><xsl:text>\mathop{\mathrm{div}}</xsl:text></xsl:template><xsl:template match="m:laplacian"><xsl:text>\nabla^2 </xsl:text></xsl:template><xsl:template match="m:set">
	<xsl:text>\{</xsl:text><xsl:call-template name="set"/><xsl:text>\}</xsl:text>
</xsl:template><xsl:template match="m:list">
	<xsl:text>\left[</xsl:text><xsl:call-template name="set"/><xsl:text>\right]</xsl:text>
</xsl:template><xsl:template name="set">
   <xsl:choose>
		<xsl:when test="m:condition">
   		<xsl:apply-templates select="m:bvar/*[not(self::bvar or self::condition)]"/>
   		<xsl:text>\colon </xsl:text>
			<xsl:apply-templates select="m:condition/node()"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:for-each select="*">
				<xsl:apply-templates select="."/>
				<xsl:if test="position()!=last()"><xsl:text>, </xsl:text></xsl:if>
			</xsl:for-each>
		</xsl:otherwise>
   </xsl:choose>
</xsl:template><xsl:template match="m:apply[*[1][self::m:union]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\cup </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:intersect]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="3"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\cap </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:in]] | m:reln[*[1][self::m:in]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo">\in </xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="3"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:notin]] | m:reln[*[1][self::m:notin]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="mo">\notin </xsl:with-param>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="this-p" select="3"/>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:subset]] | m:reln[*[1][self::m:subset]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\subseteq </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:prsubset]] | m:reln[*[1][self::m:prsubset]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\subset </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:notsubset]] | m:reln[*[1][self::m:notsubset]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\nsubseteq </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:notprsubset]] | m:reln[*[1][self::m:notprsubset]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\not\subset </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:setdiff]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\setminus </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:card]]">
	<xsl:text>|</xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>|</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:cartesianproduct or self::m:vectorproduct]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\times </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:cartesianproduct][count(following-sibling::m:reals)=count(following-sibling::*)]]" priority="2">
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="5"/>
	</xsl:apply-templates>
	<xsl:text>^{</xsl:text>
	<xsl:value-of select="count(*)-1"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:sum]]">
	<xsl:text>\sum</xsl:text><xsl:call-template name="series"/>
</xsl:template><xsl:template match="m:apply[*[1][self::m:product]]">
	<xsl:text>\prod</xsl:text><xsl:call-template name="series"/>
</xsl:template><xsl:template name="series">
	<xsl:if test="m:lowlimit/*|m:interval/*[1]|m:condition/*">
		<xsl:text>_{</xsl:text>
		<xsl:if test="not(m:condition)">
			<xsl:apply-templates select="m:bvar"/>
			<xsl:text>=</xsl:text>
		</xsl:if>
		<xsl:apply-templates select="m:lowlimit/*|m:interval/*[1]|m:condition/*"/>
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:if test="m:uplimit/*|m:interval/*[2]">
		<xsl:text>^{</xsl:text>
		<xsl:apply-templates select="m:uplimit/*|m:interval/*[2]"/>
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:text> </xsl:text>
	<xsl:apply-templates select="*[last()]"/>
</xsl:template><xsl:template match="m:apply[*[1][self::m:limit]]">
	<xsl:text>\lim_{</xsl:text>
	<xsl:apply-templates select="m:lowlimit|m:condition/*"/>
	<xsl:text>}</xsl:text>
	<xsl:apply-templates select="*[last()]"/>
</xsl:template><xsl:template match="m:apply[m:limit]/m:lowlimit" priority="3">
	<xsl:apply-templates select="../m:bvar/node()"/>
	<xsl:text>\to </xsl:text>
	<xsl:apply-templates/>
</xsl:template><xsl:template match="m:apply[*[1][self::m:tendsto]] | m:reln[*[1][self::m:tendsto]]">
	<xsl:param name="p"/>
	<xsl:call-template name="binary">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">
			<xsl:choose>
				<xsl:when test="*[1][@type='above']">\searrow </xsl:when>
				<xsl:when test="*[1][@type='below']">\nearrow </xsl:when>
				<xsl:when test="*[1][@type='two-sided']">\rightarrow </xsl:when>
				<xsl:otherwise>\to </xsl:otherwise>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][  self::m:sin or   self::m:cos or  self::m:tan or  self::m:sec or  self::m:csc or   self::m:cot or  self::m:sinh or   self::m:cosh or  self::m:tanh or   self::m:coth or self::m:arcsin or  self::m:arccos or  self::m:arctan or  self::m:ln]]">
	<xsl:text>\</xsl:text>
	<xsl:value-of select="local-name(*[1])"/>
	<xsl:text> </xsl:text>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:sin | m:cos | m:tan | m:sec | m:csc |          m:cot | m:sinh | m:cosh | m:tanh | m:coth |          m:arcsin | m:arccos | m:arctan | m:ln">
	<xsl:text>\</xsl:text>
	<xsl:value-of select="local-name(.)"/>
	<xsl:text> </xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][  self::m:sech or   self::m:csch or  self::m:arccosh or  self::m:arccot or  self::m:arccoth or  self::m:arccsc or  self::m:arccsch or self::m:arcsec or  self::m:arcsech or  self::m:arcsinh or self::m:arctanh]]">
	<xsl:text>\mathrm{</xsl:text>
	<xsl:value-of select="local-name(*[1])"/>
	<xsl:text>\,}</xsl:text>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:sech | m:csch | m:arccosh | m:arccot |          m:arccoth | m:arccsc |m:arccsch |m:arcsec |          m:arcsech | m:arcsinh | m:arctanh">
	<xsl:text>\mathrm{</xsl:text>
	<xsl:value-of select="local-name(.)"/>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:exp]]">
	<xsl:text>e^{</xsl:text><xsl:apply-templates select="*[2]"/><xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:log]]">
	<xsl:text>\lg </xsl:text>
	<xsl:apply-templates select="*[last()]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:apply[*[1][self::m:log] and m:logbase != 10]">
	<xsl:text>\log_{</xsl:text>
	<xsl:apply-templates select="m:logbase/node()"/>
	<xsl:text>}</xsl:text>
	<xsl:apply-templates select="*[last()]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:apply[*[1][self::m:mean]]">
	<xsl:text>\langle </xsl:text>
	<xsl:for-each select="*[position()&gt;1]">
		<xsl:apply-templates select="."/>
		<xsl:if test="position() !=last()"><xsl:text>, </xsl:text></xsl:if>
	</xsl:for-each>
	<xsl:text>\rangle </xsl:text>
</xsl:template><xsl:template match="m:sdev"><xsl:text>\sigma </xsl:text></xsl:template><xsl:template match="m:apply[*[1][self::m:variance]]">
	<xsl:text>\sigma(</xsl:text>
	<xsl:apply-templates select="*[2]"/>
	<xsl:text>)^2</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:moment]]">
	<xsl:text>\langle </xsl:text>
	<xsl:apply-templates select="*[last()]"/>
	<xsl:text>^{</xsl:text>
	<xsl:apply-templates select="m:degree/node()"/>
	<xsl:text>}\rangle</xsl:text>
	<xsl:if test="m:momentabout">
		<xsl:text>_{</xsl:text>
		<xsl:apply-templates select="m:momentabout/node()"/>
		<xsl:text>}</xsl:text>
	</xsl:if>
	<xsl:text> </xsl:text>
</xsl:template><xsl:template match="m:vector">
	<xsl:text>\left(\begin{array}{c}</xsl:text>
	<xsl:for-each select="*">
		<xsl:apply-templates select="."/>
		<xsl:if test="position()!=last()"><xsl:text>\\ </xsl:text></xsl:if>
	</xsl:for-each>
	<xsl:text>\end{array}\right)</xsl:text>
</xsl:template><xsl:template match="m:matrix">
	<xsl:text>\begin{pmatrix}</xsl:text>
	<xsl:apply-templates/>
	<xsl:text>\end{pmatrix}</xsl:text>
</xsl:template><xsl:template match="m:matrixrow">
	<xsl:for-each select="*">
		<xsl:apply-templates select="."/>
		<xsl:if test="position()!=last()"><xsl:text> &amp; </xsl:text></xsl:if>
	</xsl:for-each>
	<xsl:if test="position()!=last()"><xsl:text>\\ </xsl:text></xsl:if>
</xsl:template><xsl:template match="m:apply[*[1][self::m:determinant]]">
	<xsl:text>\det </xsl:text>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
</xsl:template><xsl:template match="m:apply[*[1][self::m:determinant]][*[2][self::m:matrix]]" priority="2">
	<xsl:text>\begin{vmatrix}</xsl:text>
	<xsl:apply-templates select="m:matrix/*"/>
	<xsl:text>\end{vmatrix}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:transpose]]">
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
	<xsl:text>^T</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:selector]]">
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="7"/>
	</xsl:apply-templates>
	<xsl:text>_{</xsl:text>
	<xsl:for-each select="*[position()&gt;2]">
		<xsl:apply-templates select="."/>
		<xsl:if test="position() !=last()"><xsl:text>, </xsl:text></xsl:if>
	</xsl:for-each>
	<xsl:text>}</xsl:text>
</xsl:template><xsl:template match="m:apply[*[1][self::m:scalarproduct]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\cdot </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:apply[*[1][self::m:outerproduct]]">
	<xsl:param name="p" select="0"/>
	<xsl:call-template name="infix">
		<xsl:with-param name="this-p" select="2"/>
		<xsl:with-param name="p" select="$p"/>
		<xsl:with-param name="mo">\otimes </xsl:with-param>
	</xsl:call-template>
</xsl:template><xsl:template match="m:semantics"><xsl:apply-templates select="*[1]"/></xsl:template><xsl:template match="m:semantics[m:annotation/@encoding='TeX']">
	<xsl:apply-templates select="m:annotation[@encoding='TeX']/node()"/>
</xsl:template><xsl:template match="m:integers"><xsl:text>\mathbb{Z}</xsl:text></xsl:template><xsl:template match="m:reals"><xsl:text>\mathbb{R}</xsl:text></xsl:template><xsl:template match="m:rationals"><xsl:text>\mathbb{Q}</xsl:text></xsl:template><xsl:template match="m:naturalnumbers"><xsl:text>\mathbb{N}</xsl:text></xsl:template><xsl:template match="m:complexes"><xsl:text>\mathbb{C}</xsl:text></xsl:template><xsl:template match="m:primes"><xsl:text>\mathbb{P}</xsl:text></xsl:template><xsl:template match="m:exponentiale"><xsl:text>e</xsl:text></xsl:template><xsl:template match="m:imaginaryi"><xsl:text>i</xsl:text></xsl:template><xsl:template match="m:notanumber"><xsl:text>NaN</xsl:text></xsl:template><xsl:template match="m:true"><xsl:text>\mbox{true}</xsl:text></xsl:template><xsl:template match="m:false"><xsl:text>\mbox{false}</xsl:text></xsl:template><xsl:template match="m:emptyset"><xsl:text>\emptyset </xsl:text></xsl:template><xsl:template match="m:pi"><xsl:text>\pi </xsl:text></xsl:template><xsl:template match="m:eulergamma"><xsl:text>\gamma </xsl:text></xsl:template><xsl:template match="m:infinity"><xsl:text>\infty </xsl:text></xsl:template><xsl:template name="infix">
  <xsl:param name="mo"/>
  <xsl:param name="p" select="0"/>
  <xsl:param name="this-p" select="0"/>
  <xsl:if test="$this-p &lt; $p"><xsl:text>(</xsl:text></xsl:if>
  <xsl:for-each select="*[position()&gt;1]">
		<xsl:if test="position() &gt; 1">
			<xsl:copy-of select="$mo"/>
		</xsl:if>
		<xsl:apply-templates select=".">
			<xsl:with-param name="p" select="$this-p"/>
		</xsl:apply-templates>
	</xsl:for-each>
  <xsl:if test="$this-p &lt; $p"><xsl:text>)</xsl:text></xsl:if>
</xsl:template><xsl:template name="binary">
  <xsl:param name="mo"/>
  <xsl:param name="p" select="0"/>
  <xsl:param name="this-p" select="0"/>
  <xsl:if test="$this-p &lt; $p"><xsl:text>(</xsl:text></xsl:if>
	<xsl:apply-templates select="*[2]">
		<xsl:with-param name="p" select="$this-p"/>
	</xsl:apply-templates>
	<xsl:value-of select="$mo"/>
	<xsl:apply-templates select="*[3]">
    	<xsl:with-param name="p" select="$this-p"/>
	</xsl:apply-templates>
	<xsl:if test="$this-p &lt; $p"><xsl:text>)</xsl:text></xsl:if>
</xsl:template>

<xsl:strip-space elements="m:*"/>

<xsl:template match="m:math">
	<xsl:apply-templates/>
</xsl:template>

</xsl:stylesheet>
