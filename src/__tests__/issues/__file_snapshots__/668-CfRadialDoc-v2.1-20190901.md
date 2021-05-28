---
references:
  - >-
    Axford, D. N., 1968: On the accuracy of wind measurements using an inertial
    platform in an aircraft, and an example of a measurement of the vertical
    structure of the atmosphere. J. Appl. Meteor., 7, 645-666.
  - authors:
      - familyNames:
          - DOVIAK
        givenNames:
          - RICHARD J.
        type: Person
      - familyNames:
          - ZRNIĆ
        givenNames:
          - DUŠAN S.
        type: Person
    title: Weather Echo Signals
    datePublished:
      value: '1984'
      type: Date
    isPartOf:
      name: Doppler Radar and Weather Observations
      type: Periodical
    publisher:
      name: Elsevier
      type: Organization
    identifiers:
      - name: doi
        propertyID: https://registry.identifiers.org/registry/doi
        value: 10.1016/b978-0-12-221420-2.50009-0
        type: PropertyValue
    url: http://dx.doi.org/10.1016/b978-0-12-221420-2.50009-0
    type: CreativeWork
    id: ref2
  - >-
    Lee, W., P. Dodge, F. D. Marks Jr. and P. Hildebrand, 1994: Mapping of
    Airborne Doppler Radar Data. Journal of Oceanic and Atmospheric Technology,
    11, 572 – 578.
  - >-
    Michelson D.B., Lewandowski R., Szewczykowski M., Beekhuis H., and Haase G.,
    2014: EUMETNET OPERA weather radar information model for implementation with
    the HDF5 file format. Version 2.2. EUMETNET OPERA Output O4. 38 pp.
  - >-
    Rinehart, R. E., 2004: Radar for Meteorologists, Fourth Edition. Rinehart
    Publications. ISBN 0-9658002-1-0
---

CfRadial2 Data File Format

# CF2 NetCDF Format for

# RADAR and LIDAR data

# in Radial Coordinates

Version 2.1 - DRAFT

Mike Dixon, EOL, NCAR, Boulder, Colorado, USA!nullMark Curtis, Bureau of Meteorology, Melbourne, Australia!nullDaniel Michelson, Environment and Climate Change Canada, Toronto, Canada

Joe Hardin, PNNL, DOE, Richland, Washington, USA

Ken Kehoe, University of Oklahoma, Norman, Oklahoma, USA

Samuel Haimov, University of Wyoming, Laramie, Wyoming, USA

Updated 2019-09-01

# Table of Contents

[1 Introduction 5](#introduction)

[1.1 Purpose 5](#purpose)

[1.2 On-line location 5](#on-line-location)

[1.3 Terminology – CfRadial1 and CfRadial2 5](#terminology-cfradial1-and-cfradial2)

[1.4 History 5](#history)

[1.5 CF2 and CfRadial2 6](#cf2-and-cfradial2)

[1.6 On-line URLs 7](#on-line-urls)

[2 Radar/Lidar Data Information Model 8](#radarlidar-data-information-model)

[2.1 Logical organization of data in a volume, using sweeps and rays 8](#logical-organization-of-data-in-a-volume-using-sweeps-and-rays)

[2.2 Logical organization of data in a volume, using sweeps with 2-D data 10](#logical-organization-of-data-in-a-volume-using-sweeps-with-2-d-data)

[2.3 Field data byte representation 12](#field-data-byte-representation)

[2.4 Scanning modes 12](#scanning-modes)

[2.5 Geo-reference variables 13](#geo-reference-variables)

[3 Structure of CfRadial2 using NetCDF4 with groups 14](#structure-of-cfradial2-using-netcdf4-with-groups)

[3.1 Group-based data structure 14](#group-based-data-structure)

[3.2 Principal dimensions and coordinate variables 17](#principal-dimensions-and-coordinate-variables)

[3.3 \_FillValue and missing_value attributes for data fields 18](#fillvalue-and-missing_value-attributes-for-data-fields)

[3.4 Required vs. optional variables 18](#required-vs.-optional-variables)

[3.5 Grid mapping variable – radar_lidar_radial_scan 18](#grid-mapping-variable-radar_lidar_radial_scan)

[3.6 Extensions to the CF convention 19](#extensions-to-the-cf-convention)

[3.7 String types 19](#string-types)

[4 Root group 21](#root-group)

[4.1 Global attributes 21](#global-attributes)

[4.2 Global Dimensions 22](#global-dimensions)

[4.3 Global variables 22](#global-variables)

[5 Sweep groups 25](#sweep-groups)

[5.1 Sweep-specific Dimensions 25](#sweep-specific-dimensions)

[5.2 Sweep coordinate variables 25](#sweep-coordinate-variables)

[5.2.1 Attributes for time coordinate variable 25](#attributes-for-time-coordinate-variable)

[5.2.2 Attributes for range coordinate variable 26](#attributes-for-range-coordinate-variable)

[5.3 Sweep variables 26](#sweep-variables)

[5.3.1 Attributes for azimuth(time) variable 29](#attributes-for-azimuthtime-variable)

[5.3.2 Attributes for elevation(time) variable 30](#attributes-for-elevationtime-variable)

[5.4 The _georeference_ sub-group 30](#the-georeference-sub-group)

[5.5 The _monitoring sub-groups_!number(32)](#the-monitoring-sub-groups)

[5.6 Field data variables 33](#field-data-variables)

[5.6.1 Use of scale_factor and add_offset 36](#use-of-scale_factor-and-add_offset)

[5.6.2 Use of coordinates attribute 36](#use-of-coordinates-attribute)

[5.6.3 Use of flag values - optional 36](#use-of-flag-values---optional)

[5.6.4 Flag mask fields - optional 37](#flag-mask-fields---optional)

[5.6.5 Quality control fields - optional 37](#quality-control-fields---optional)

[5.6.6 Thresholding XML 37](#thresholding-xml)

[5.6.7 Legend XML 38](#legend-xml)

[6 Spectrum groups 39](#spectrum-groups)

[6.1 Spectrum-specific information on sweep 39](#spectrum-specific-information-on-sweep)

[!number(6.2)_spectrum_index_ variable 39](#spectrum_index-variable)

[6.3 Spectrum group dimensions 39](#spectrum-group-dimensions)

[6.4 Spectrum field variables 40](#spectrum-field-variables)

[6.5 Spectrum field attributes 40](#spectrum-field-attributes)

[7 Root group metadata groups 42](#root-group-metadata-groups)

[7.1 The _radar_parameters_ sub-group 42](#the-radar_parameters-sub-group)

[7.2 The _lidar_parameters_ sub-group 42](#the-lidar_parameters-sub-group)

[7.3 The _radar_calibration_ sub-group 42](#the-radar_calibration-sub-group)

[7.3.1 Dimensions 43](#dimensions)

[7.3.2 Variables 43](#variables)

[7.4 The _lidar_calibration_ sub-group 46](#the-lidar_calibration-sub-group)

[7.5 The _georeference_correction_ sub-group 46](#the-georeference_correction-sub-group)

[8 Standard names 48](#_Toc18347436)

[9 Computing the data location from geo-reference variables 49](#computing-the-data-location-from-geo-reference-variables)

[9.1 Special case – ground-based, stationary and leveled sensors 50](#special-case-ground-based-stationary-and-leveled-sensors)

[9.1.1 LIDARs![](data:image/wmf;base64,183GmgAAAAAAACABwAEECQAAAAD1XgEACQAAA7oAAAAAAGwAAAAAAAUAAAACAQEAAAAFAAAAAQL///8ABQAAAC4BGQAAAAUAAAALAgAAAAAFAAAADALAASABEwAAACYGDwAcAP////8AAE4AEAAAAMD///+m////4AAAAGYBAAALAAAAJgYPAAwATWF0aFR5cGUAACAAbAAAACYGDwDNAE1hdGhUeXBlVVXBAAUBAAUCRFNNVDUAARNXaW5BbGxCYXNpY0NvZGVQYWdlcwARBVRpbWVzIE5ldyBSb21hbgARA1N5bWJvbAARBUNvdXJpZXIgTmV3ABEETVQgRXh0cmEAEgAIIS9Fj0QvQVD0EA9HX0FQ8h8eQVD0FQ9BAPRF9CX0j0JfQQD0EA9DX0EA9I9F9CpfSPSPQQD0EA9A9I9Bf0j0EA9BKl9EX0X0X0X0X0EPDAEAAQABAgICAgACAAEBAQADAAEABAAACgAACwAAACYGDwAMAP////8BAAAAAAAAAAMAAAAAAA==)!number(50)](#lidars)

[9.1.2 RADARs 50](#radars)

[9.2 Moving platforms 51](#moving-platforms)

[9.3 Coordinate transformations for the general case 52](#coordinate-transformations-for-the-general-case)

[9.3.1 Coordinate systems 52](#coordinate-systems)

[9.3.2 The earth-relative coordinate system 52](#the-earth-relative-coordinate-system)

[9.3.3 The platform-relative coordinate system 52](#the-platform-relative-coordinate-system)

[9.3.4 The sensor coordinate system 55](#the-sensor-coordinate-system)

[9.4 Coordinate transformation sequence 56](#coordinate-transformation-sequence)

[9.4.1 Transformation from X~i~ to X~a~!number(56)](#transformation-from-xi-to-xa)

[9.4.2 Rotating from X~a~ to X 57](#rotating-from-xa-to-x)

[9.5 Summary of transforming from X~i~ to X 59](#summary-of-transforming-from-xi-to-x)

[9.5.1 For type Z radars: 59](#for-type-z-radars)

[9.5.2 For type Y radars: 59](#for-type-y-radars)

[9.5.3 For type Y-prime radars: 59](#for-type-y-prime-radars)

[9.5.4 For type X radars: 60](#for-type-x-radars)

[9.5.5 Computing earth-relative azimuth and elevation 60](#computing-earth-relative-azimuth-and-elevation)

[9.6 Summary of symbol definitions 60](#summary-of-symbol-definitions)

[10 References 61](#references)

# Introduction

## Purpose

The CfRadial2 format is intended to provide a standard, modern, self-describing way to store radar and lidar data in native radial (polar) coordinates.

CfRadial2 is built on NetCDF-4, which is in turn built on HDF5. NetCDF-4 and HDF5 are both up-to-date technology for efficiently and easily storing scientific and engineering data.

The purpose of this document is to specify a CF2-compliant NetCDF format for radar and lidar moments data in radial (i.e. polar) coordinates.

The intention is that the format should, as far as possible, comply with the CF conventions for gridded data. However, the current CF 2.0 convention does not support radial radar/lidar data. Therefore, extensions to the conventions will be required.

The current CF conventions are documented at:

<http://cfconventions.org/>

<http://cfconventions.org/Data/cf-conventions/cf-conventions-1.7/cf-conventions.pdf>

## On-line location

This document, and other related information, is on-line at:

> https&#x3A;//github.com/NCAR/CfRadial/docs

## Terminology – CfRadial1 and CfRadial2

We will refer to CfRadial 2.1, and future 2.x versions, collectively as CfRadial2.

The previous versions, 1.1 though 1.4, will be referred to collectively as CfRadial1.

## History

CfRadial was introduced in 2011 as a format designed to store data from scanning weather radars and lidars in an accurate and lossless manner.

Since digital weather radars made their debut in the 1970s, a wide variety of data formats has emerged for pulsed instruments (radar and lidar) in polar coordinates. Researchers and manufacturers have tended to develop formats unique to their instruments, and since 1990 NCAR has supported over 20 different data formats for radar and lidar data. Researchers, students and operational users spend unnecessary time handling the complexity of these formats.

CfRadial grew out of the need to simplify the use of data from weather radars and lidars and thereby to improve efficiency. CfRadial adopts the well-known NetCDF framework, along with the Climate and Forecasting (CF) conventions. It is designed to accurately store the metadata and data produced by the instruments, in their native polar coordinates, without any loss of information. Mobile platforms are supported. Data field identification is facilitated by the 'standard_name' convention in CF, so that fields derived from algorithms (such as hydrometeor type) can be represented just as easily as the original fields (such as radar reflectivity).

table:
:::
Table 1.1: History of CfRadial versions

| **Date**   | **Version** | **Remarks**                                                                                                                                                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2011/02/01 | 1.1         | First operational version. NetCDF classic data model.                                                                                                                                                               |
| 2011/06/07 | 1.2         | Minor changes / additions. NetCDF classic data model.                                                                                                                                                               |
| 2013/07/01 | 1.3         | Major changes / additions. NetCDF classic data model.                                                                                                                                                               |
| 2016/08/01 | 1.4         | Major additions – data quality, spectra. NetCDF classic data model.                                                                                                                                                 |
| 2017/06/02 | 2.0 DRAFT   | Major revision – not backward compatible with CfRadial1Uses NetCDF 4 and groups.Combines CfRadial 1.4 and ODIM_H5 version 2.2.                                                                                      |
| 2019/02/03 | 2.0 DRAFT   | (a) ray_angle_res changed to ray_angle_resolution(b) fixed_angle changed to sweep_fixed_angle(c) Added sweep modes: doppler_beam_swinging, complex_trajectory and electronic_steering.2.0 deprecated on 2019/09/01. |
| 2019/09/01 | 2.1DRAFT    | A number of issues were raised related to draft version 2.0. The 2.1 draft addresses those issues. It is not backward compatible with version 2.0.                                                                  |
:::

CfRadial1 has been adopted by NCAR, as well as NCAS (the UK National Center for Atmospheric Science) and the US DOE Atmospheric Radiation Measurement (ARM) program. CfRadial development was boosted in 2015 through a two-year NSF EarthCube grant to improve CF in general. Following the CF user community workshop in Boulder Colorado in May 2016, version 1.4 was agreed upon, adding explicit support for quality fields and spectra.

CfRadial2 has been proposed as an official exchange format for the WMO.

## CF2 and CfRadial2

In 2015 the US National Science Foundation (NSF) funded the project “EarthCube IA: Advancing NetCDF-CF for the Geoscience Community". This project aims to update the CF conventions to make better use of NetCDF4 capabilities, such as groups, to organize data in CF-compliant files. CF2.0 standards will be developed to guide this process. The development of CfRadial2 is part of this work. A workshop was held in Boulder Colorado, in May 2016, to assess and collaborate on progress to Cf2.0.

Shortly after that, in July 2016, a WMO-sponsored meeting was held at NCAR in Boulder, during which the WMO Task Team on Weather Radar Data Exchange (TT-WRDE) considered the adoption of a single WMO-recommended format for radar and lidar data in polar coordinates. The two modern formats discussed as options were CfRadial and the European operational radar community ODIM_H5 (HDF5) format (Michelson et al. 2014), in addition to the older and more rigid table-driven BUFR and GRIB2 formats. TT-WRDE recommended that CfRadial 1.4 be merged with the sweep-oriented structure of ODIM_H5, making use of groups to produce a single WMO format that will encompass the best ideas of both formats. That has led to the emergence of CfRadial2. This format should meet the objectives of both the NSF EarthCube CF 2.0 initiative and the WMO.

## On-line URLs

This document, older versions, full history and other related information, are available on-line at:

> <https://github.com/NCAR/CfRadial/tree/master/docs>

These include detailed documentation of versions 1.1 through 1.4, as well as the current CfRadial2 development.

The current NetCDF CF conventions are documented at:

<http://cfconventions.org/>

<http://cfconventions.org/Data/cf-conventions/cf-conventions-1.7/cf-conventions.pdf>

# Radar/Lidar Data Information Model

## Logical organization of data in a volume, using sweeps and rays

Radars and lidars are pulsing instruments that either scan in polar coordinates, or stare in a fixed direction.

A **volume scan** (or simply a **volume)** is defined as a scanning sequence that repeats over time.

Figure 2.1: logical data structure for a volume scan,!nullusing sweep and ray abstractions and 1-D data field arrays

Figure 2.1 shows an idealized data model for a radar or lidar **volume**, representing the data fields as 1-D arrays on a ray object.

A **volume** consists of a series of 1 or more **sweeps** (defined below).

As a radar or lidar scans (or points), the data **fields** (commonly known as ‘**moments’**) are computed over limits specified by a time interval or angular interval.

We refer to this entity as a **ray**, **beam** or **dwell**. In this document we will use the term **ray**.

A **sweep** is a collection of **rays**, for which certain properties remain constant. Examples are:

-   PPI 360-degree surveillance (target elevation angle constant)
-   PPI sector (target elevation angle constant)
-   RHI (target azimuth angle constant)
-   time period for vertically pointing instrument (azimuth and elevation both constant)

The following _always_ remain constant for all **rays** in a **sweep**:

-   number of gates
-   range geometry (range to each gate)
-   sweep mode (_surveillance, sector, RHI_, etc.)
-   target angle(s)

The following would _usually_ remain constant for the **rays** in a **sweep**:

-   nominal scan rate
-   pulse width
-   pulsing scheme
-   Nyquist velocity
-   data quality control procedures

For a given **ray**, the **field** (or moments) data are computed for a sequence of **ranges** increasing radially away from the instrument. These are referred to as range **gates**.

A **ray** contains a number of **fields**, with a value for each **field** at each **gate**. In the ray abstraction, fields are represented as 1-D arrays, with length **range**.

## Logical organization of data in a volume, using sweeps with 2-D data

Figure 2.2: logical data structure for a volume scan,!nullusing the sweep abstraction with 2-D data fields

In contrast to Figure 2.1, Figure 2.2 shows a modified data model, in which the **sweeps** contain the **field** (moments) data directly, stored as 2-D arrays of \[time]\[range]. This requires that the number of gates be constant for all rays in a sweep.

This is the data model that has been adopted for CfRadial2. Figure 2.3 below has more detail.

This representation has the advantage that the 2-D arrays per sweep simplify the data storage mechanism, and allow for more efficient data compression than do 1-D arrays per ray.

Figure 2.3 Data field for a sweep, represented in time and range,!nullwith a constant number of range gates

## Field data byte representation

The field data will be stored using one of the following:

table:
:::
Table 2.1: field data representation

| NetCDF type    | Byte width | Description             |
| -------------- | ---------- | ----------------------- |
| signed char    | 1          | scaled signed integer   |
| unsigned char  | 1          | scaled unsigned integer |
| signed short   | 2          | scaled signed integer   |
| unsigned short | 2          | scaled unsigned integer |
| signed int     | 4          | scaled signed integer   |
| unsigned int   | 4          | scaled unsigned integer |
| signed long    | 8          | scaled signed integer   |
| signed long    | 8          | scaled unsigned integer |
| float          | 4          | floating point          |
| double         | 8          | floating point          |
:::

For the integer types, the stored data values are interpreted as:

data_value = (integer_value \* scale_factor) + add_offset.

The _scale_factor_ and _add_offset_ are provided as metadata attributes on the field.

## Scanning modes

Scanning may be carried out in a number of different ways. For example:

-   horizontal scanning at fixed elevation (PPI mode), sector or 360 degree surveillance
-   vertical scanning at a constant azimuth (RHI mode)
-   antenna stationary, i.e. constant elevation and azimuth (staring or pointing)
-   aircraft radars which rotate around the longitudinal axis of the aircraft (e.g. ELDORA, NOAA Tail Radar)
-   sun scanning in either PPI or RHI mode.

For each of these modes a **sweep** is defined as follows:

-   PPI mode: a sequence of rays at a fixed elevation angle, but changing azimuth angles
-   RHI mode: a sequence of rays at a fixed azimuth angle but changing elevation angles
-   pointing mode: a sequence of rays over some time period, at fixed azimuth and elevation
-   aircraft tail-type radars: a sweep starts at a rotation angle of 0 (antenna pointing vertically upwards) and ends 360 degrees later.

As the antenna transitions between sweeps, some rays may be recorded during the transition. For many radars, especially operational types, these rays are filtered out at the source. For some research radars, however, the rays are retained, and an **antenna_transition flag** is set for these rays to allow them to be optionally filtered out at a later processing stage.

## Geo-reference variables

Metadata variables in CfRadial are used to locate a radar or lidar measurement in space.

These are:

-   range
-   elevation
-   azimuth
-   latitude
-   longitude
-   altitude

See sections 4.3 and 5.4 for details on these variables.

For moving platforms, extra variables are required for geo-referencing. These are:

-   heading
-   roll
-   pitch
-   rotation
-   tilt

See section 5.4 for details on these variables.

The mathematical procedures for computing data location relative to earth coordinates are described in detail in section 9.

# Structure of CfRadial2 using NetCDF4 with groups

## Group-based data structure

In order to be readily accessible to scientists in the user community using legacy applications, CfRadial1 uses the flat classic model of NetCDF3. A drawback of this approach is that the implementation quickly becomes complicated, since much of the metadata is placed at the top level in the data structure. Namespace clashes can easily occur.

By contrast, the European ODIM_H5 format makes extensive use of HDF5 groups to provide logical separation between data at different levels in the structure. In fact ODIM tends to rather over-use this approach, leading to complexity of a different type.

In designing CfRadial2, we chose to merge CfRadial1 and ODIM_H5, adopting the best features of each to produce a clear implementation that is as simple as reasonable, but no simpler. CfRadial2 makes use of the group capability available in NetCDF4.

CfRadial2 adopts the sweep-based model of Figure 2.2. The overall structure is shown in Figure 3.1 below.

The top-level (default) root group holds the global dimensions, attributes and variables. Nested below this group is a sub-group for each sweep. The name of the sweep sub-groups is provided in a string array named ‘sweep_group_name’, also at the top level. This allows the user to locate the sweep groups directly.

CfRadial2 supports moving platforms (aircraft, ships and vehicles), which requires storing the georeference data accurately at each ray time. Furthermore, storage of spectra on a gate-by-gate basis, for example for vertically-pointing precipitation radars, is supported. Figure 3.2 shows these details. Both of these are specializations, and are not required for most fixed operational radars.

A number of optional groups are available in the root group, to support radar and lidar parameters, calibrations, and corrections to the georeferenced data. These are shown in figure 3.3.

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAADCAYAAAD2t91RAAAAAXNSR0ICQMB9xQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUATWljcm9zb2Z0IE9mZmljZX/tNXEAAAAeSURBVCjPY2hsbGQYDBhCMDDsB+L/A4T3wx0yGDAAL4mJM/d2FKwAAAAASUVORK5CYII=)![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAADCAYAAAD2t91RAAAAAXNSR0ICQMB9xQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUATWljcm9zb2Z0IE9mZmljZX/tNXEAAAAeSURBVCjPY2hsbGQYDBhCMDDsB+L/A4T3wx0yGDAAL4mJM/d2FKwAAAAASUVORK5CYII=)

Figure 3.1: Group structure showing top-level dimensions,!nullattributes, variables and sweep groups

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAADCAYAAAD2t91RAAAAAXNSR0ICQMB9xQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUATWljcm9zb2Z0IE9mZmljZX/tNXEAAAAeSURBVCjPY2hsbGQYDBhCMDDsB+L/A4T3wx0yGDAAL4mJM/d2FKwAAAAASUVORK5CYII=)![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAADCAYAAAD2t91RAAAAAXNSR0ICQMB9xQAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUATWljcm9zb2Z0IE9mZmljZX/tNXEAAAAeSURBVCjPY2hsbGQYDBhCMDDsB+L/A4T3wx0yGDAAL4mJM/d2FKwAAAAASUVORK5CYII=)

Figure 3.2: Sweep group structure in more detail, showing!nullsupport for geo-freference metadata for moving platforms,!nullspectra, and monitoring data.!nullOptional groups are in blue.

Figure 3.3: Optional metadata groups (in blue) in the root group

## Principal dimensions and coordinate variables

The principal dimensions for data in a sweep are **time** and **range**. In CF terminology these are referred to as _coordinate variables_, which must have the same name for both the dimension and the variable.

The primary coordinate is **time** and the secondary coordinate is **range**.

The length of the **time** coordinate indicates the number of rays in the sweep.

The length of the **range** coordinate indicates the number of gates for the rays in the sweep.

The **time(time)** coordinate variable stores the double precision time of each ray, in seconds, from a reference time, which is normally the start of the volume **(time_coverage_start)**. The units attribute for time indicates the time from which it is referenced.

The **range(range)** coordinate variable stores the range to the center of each gate. All rays in the sweep must have the same range geometry.

The **elevation(time)** coordinate variable stores the elevation angle for each ray.

The **azimuth(time)** coordinate variable stores the azimuth angle for each ray.

The data fields are stored as 2-D arrays, with dimensions **(time, range)**.

## \_FillValue and missing_value attributes for data fields

CF 1.6 states that the use of **missing_value** is deprecated, and that only **\_FillValue** should be used.

For CfRadial2, **\_FillValue** is preferred. However, **missing_value** may be used.

Only one or the other should be specified, not both.

Applications reading CfRadial data should check for both of these attributes.

NetCDF 4 is built on HDF5, which supports compression. Where data are missing or unusable, the data values will be set to a constant well-known **\_FillValue** (or **missing_value**) code. This facilitates efficient compression.

## Required vs. optional variables

Required variables are shown shaded in this document.

All other variables are optional.

If an optional variable is not provided, reader applications should set the variable to a missing value as appropriate.

## Grid mapping variable – radar_lidar_radial_scan

The data in this format is saved in the native coordinate system for radars and lidars, i.e. radial (or polar) coordinates, with the instrument at the origin.

In order to properly support this type of data, the _radar_lidar_radial_scan_ grid mapping has been introduced to the CF Conventions:

The mapping parameters are:

• _latitude_of_projection_origin_

• _longitude_of_projection_origin_

• _height_of_projection_origin_

The relevant coordinate variables are as follows:

| Coordinate variable               | Standard name                          | Auxiliary reference                        |
| --------------------------------- | -------------------------------------- | ------------------------------------------ |
| range (line-of-sight slant range) | line_of_sight_distance_from_instrument |                                            |
| azimuth                           | sensor_to_target_azimuth_angle         | Auxiliary coordinate on the time dimension |
| elevation                         | sensor_to_target_elevation_angle       | Auxiliary coordinate on the time dimension |

The relevant grid mapping attributes are:

| Attribute                   | Type | Description                                                                                                                                                                                                                        |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| height_of_projection_origin | N    | Records the height, in meters, of the map projection origin point above the ellipsoid (or sphere). Used by radial scan type projections to indicate the altitude of the sensor to which the polar coordinate system is referenced. |

A general description of radar projection is given in Doviak\[1984], page 13, equation 2.28b. Note: there is no corresponding projection in PROJ.4.

## Extensions to the CF convention

This convention requires the following extensions to CF:

1.  The following axis attribute types:

-   axis = "radial_azimuth_coordinate";
-   axis = "radial_elevation_coordinate";
-   axis = "radial_range_coordinate";

1.  For CfRadial to follow CF properly, support for the following must be added to the supported units:

-   dB (ratio of two values, in log units. For example, ZDR).
-   dBm (power in milliwatts, in log units)
-   dBZ (radar reflectivity in log units)

1.  Additional standard names – see section 8.

Given the above extensions, CfRadial2 files will be CF2 compliant.

table:
:::
NOTE on units: in the following tables, for conciseness, we do not spell out the **units** strings exactly as they are in the NetCDF file. Instead, the following abbreviations are used:

| **Units string in NetCDF file** | **Abbreviation in tables** |
| ------------------------------- | -------------------------- |
| “degrees per second”            | degrees/s                  |
| “meters per second”             | m/s                        |
:::

## String types

In NetCDF 4, strings may be represented either as an array of chars (NC_CHAR), or as a string (NC_STRING).

In CfRadial2, all string _**variables**_ must be of type NC_STRING. Use of full string types means that no dimension is required for the string length.

String _**attributes**_ may be of type NC_STRING or NC_CHAR. **NC_STRING** is the preferred option.

In C, a string attribute is written using the NetCDF API function nc_put_att_string, whereas a char array attribute is written using the nc_put_att_text function.

# Root group

The following sections present the details of the information in the top-level (root) group of the data set.

NOTE that in the tables below, shading indicates required items. The non-shaded items are optional.

## Global attributes

| Attribute name          | Type          | Convention    | Description                                                                                                                                    |
| ----------------------- | ------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Conventions             | string        | CF            | Conventions string will specify “Cf/Radial”.                                                                                                   |
| version                 | string        | CF/Radial     | CF/Radial version number(“2.0”)                                                                                                                |
| title                   | string        | CF            | Short description of file contents                                                                                                             |
| institution             | string        | CF            | Where the original data were produced                                                                                                          |
| references              | string        | CF            | References that describe the data or the methods used to produce it                                                                            |
| source                  | string        | CF            | Method of production of the original data                                                                                                      |
| history                 | string        | CF            | List of modifications to the original data                                                                                                     |
| comment                 | string        | CF            | Miscellaneous information                                                                                                                      |
| instrument_name         | string        | CF/Radial     | Name of radar or lidar                                                                                                                         |
| site_name               | string        | CF/Radial     | Name of site where data were gathered                                                                                                          |
| scan_name               | string        | CF/Radial     | Name of scan strategy used, if applicable                                                                                                      |
| scan_id                 | int           | CF/Radial     | Scan strategy id, if applicable.Assumed 0 if missing.                                                                                          |
| platform_is_mobile      | string        | CF/Radial     | “true” or “false”Assumed “false” if missing.                                                                                                   |
| ray_times_increase      | string        | CF/Radial     | “true” or “false”Assumed “true” if missing.This is set to true if ray times increase monotonically throughout all of the sweeps in the volume. |
| ~~field_names~~         | ~~string\[]~~ | ~~CF/Radial~~ | ~~Array of strings of field names present in this file.~~                                                                                      |
| ~~time_coverage_start~~ | ~~string~~    | ~~CF/Radial~~ | ~~Copy of time_coverage_start global variable in 4.3.~~                                                                                        |
| ~~time_coverage_end~~   | ~~string~~    | ~~CF/Radial~~ | ~~Copy of time_coverage_end global variable in 4.3.~~                                                                                          |
| simulated data          | string        | ODIM          | “true” or “false”Assumed “false” if missing.Data in this file are simulated                                                                    |

## Global Dimensions

| Dimension name | Description                         |
| -------------- | ----------------------------------- |
| sweep          | The number of sweeps in the dataset |

## Global variables

| Variable name       | Dimension | Type   | Units                                                                                    | Comments                                                                                                                                                                                                                                                                   |
| ------------------- | --------- | ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| volume_number       |           | int    |                                                                                          | Volume numbers are sequential, relative to some arbitrary start time, and may wrap.                                                                                                                                                                                        |
| platform_type       |           | string |                                                                                          | Options are:_“fixed”, “vehicle”, “ship”, “aircraft”,“aircraft_fore”,“aircraft_aft”,“aircraft_tail”,“aircraft_belly”,“aircraft_roof”,“aircraft_nose”,“satellite_orbit”,“satellite_geostat”__Assumed “fixed” if missing._                                                    |
| instrument_type     |           | string |                                                                                          | Options are: “_radar_”, “_lidar_”Assumed “_radar_” if missing.                                                                                                                                                                                                             |
| primary_axis        |           | string |                                                                                          | Options are:_“axis_z”, “axis_y”, “axis_x”, “axis_z_prime”, “axis_y_prime”, “axis_x_prime”._See section 9 for details.Assumed “_axis_z_” if missing.                                                                                                                        |
| time_coverage_start |           | double | ISO8601 string:“seconds since YYYY-MM-DD HH:MM:SS” or“seconds since YYYY-MM-DDTHH:MM:SS” | UTC time of first ray in file.                                                                                                                                                                                                                                             |
| time_coverage_end   |           | double | ISO8601 string:“seconds since YYYY-MM-DD HH:MM:SS” or“seconds since YYYY-MM-DDTHH:MM:SS” | UTC time of last ray in file.                                                                                                                                                                                                                                              |
| latitude            |           | double | degrees_north                                                                            | Latitude of instrument,using WGS84.For a mobile platform, this is a latitude at the start of the volume.                                                                                                                                                                   |
| longitude           |           | double | degrees_east                                                                             | Longitude of instrument,using WGS84For a mobile platform, this is the longitude at the start of the volume.                                                                                                                                                                |
| altitude            |           | double | meters                                                                                   | Altitude of instrument, above mean sea level, using WGS84 and EGM2008 geoid corrections.For a scanning radar, this is the center of rotation of the antenna.For a mobile platform, this is the altitude at the start of the volume.                                        |
| altitude_agl        |           | double | meters                                                                                   | Altitude of instrument above ground level.Omit if not known.                                                                                                                                                                                                               |
| sweep_group_name    | (sweep)   | string |                                                                                          | Array of names for sweep groups.Allows the user to locate the sweep groups directly.                                                                                                                                                                                       |
| sweep_fixed_angle   | (sweep)   | float  | degrees                                                                                  | Array of fixed angles for sweeps. This summarizes the fixed angles for all of the sweeps, so that a user does not need to read individual sweep groups to determine the fixed angles. The value should be copied from the sweep_fixed_angle attribute in the sweep groups. |
| status_str          |           | string |                                                                                          | General-purpose string for storing any information that is not included in other parts of the data structure. Format can be simple text,XML, JSon, etc.                                                                                                                    |

# Sweep groups

This section provides details of the information in each sweep group.

The name of the sweep groups is found in the _sweep_group_name_ array variable in the root group.

NOTE that in the tables below, shading indicates required items. The non-shaded items are optional.

## Sweep-specific Dimensions

| Dimension name  | Description                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| time            | The number of rays.                                                                                               |
| range           | The number of range bins                                                                                          |
| prt             | Number of prts used in pulsing scheme.Optional for fixed, staggered or dualRequired for more complicated schemes. |
| spectrum_groups | Number of spectrum groups in this sweep                                                                           |
| frequency       | Number of frequencies used                                                                                        |

## Sweep coordinate variables

| Variable name | Dimension | Type   | Units                                                                                 | Comments                                                   |
| ------------- | --------- | ------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| time          | (time)    | double | ISO8601 string:“seconds sinceYYYY-MM-DD HH:MM:SS”or“seconds sinceYYYY-MM-DDTHH:MM:SS” | Coordinate variable for time.Time at center of each ray.   |
| range         | (range)   | float  | meters                                                                                | Coordinate variable for range.Range to center of each bin. |

### Attributes for time coordinate variable

| Attribute name | Type   | Value                                                                                                                                                                                          |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| standard_name  | string | “time”                                                                                                                                                                                         |
| units          | string | ISO8601 string“seconds since _YYYY_-_MM_-_DD_T_hh:mm:ss_Z”,where the actual reference time values are used.                                                                                    |
| calendar       | string | Defaults to “gregorian” if missing.Options are:“gregorian” or “standard”,“proleptic_gregorian”,“noleap” or “365_day”,“all_leap” or “366_day”,“360_day”,“julian”See CF conventions for details. |

### Attributes for range coordinate variable

| Attribute name                 | Type   | Value                                                                                     |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| standard_name                  | string | “projection_range_coordinate”                                                             |
| long_name                      | string | “range to measurement volume”                                                             |
| units                          | string | “meters”                                                                                  |
| spacing_is_constant            | string | “true” or “false”                                                                         |
| meters_to_center_of_first_gate | float  | Start range in meters.                                                                    |
| meters_between_gates           | float  | Gate spacing in meters.Required ifspacing_is_constant is “true”.Not applicable otherwise. |
| axis                           | string | “radial_range_coordinate”                                                                 |

## Sweep variables

| Variable name         | Dimension        | Type   | Units     | Comments                                                                                                                                                                                                                           |
| --------------------- | ---------------- | ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sweep_number          |                  | int    |           | The number of the sweep, in the volume scan.0-based.                                                                                                                                                                               |
| sweep_mode            |                  | string |           | Options are:_“sector”,“coplane”,rhi”,“vertical_pointing”,“idle”,“azimuth_surveillance”,“elevation_surveillance”,“sunscan”,“pointing”,“manual_ppi”,“manual_rhi”,“doppler_beam_swinging”,“complex_trajectory”,“electronic_steering”_ |
| follow_mode           |                  | string |           | options are: _“none”, “sun”, “vehicle”, “aircraft”, “target”, “manual”__Assumed “none” if missing._                                                                                                                                |
| prt_mode              |                  | string |           | Pulsing modeOptions are: _“fixed”, “staggered”, “dual”, “hybrid”.Assumed “fixed” if missing.May also be more complicated pulsing schemes, such as HHVV, HHVVH etc._                                                                |
| frequency             | (frequency)      | float  | s-1       | List of operating frequencies, in Hertz.In most cases, only a single frequency is used.                                                                                                                                            |
| polarization_mode     |                  | string |           | Options are: _“horizontal”, “vertical”, “hv_alt”, “hv_sim”, “circular” Assumed “horizontal” if missing._                                                                                                                           |
| polarization_sequence | (prt)            | string |           | This only applies if prt_mode is set to “hybrid”. As an example, the form of it would be \[‘H’,’H’,’V’,’V’,’H’] for HHVVH pulsing.                                                                                                 |
| sweep_fixed_angle     |                  | float  | degrees   | Target angle for the sweep.elevation in most modesazimuth in RHI mode                                                                                                                                                              |
| rays_are_indexed      |                  | string |           | “true” or “false”Indicates whether or not the ray angles (elevation in RHI mode, azimuth in other modes) are indexed to a regular grid.                                                                                            |
| ray_angle_resolution  |                  | float  | degrees   | If rays_are_indexed is “true”, this is the resolution of the angular grid – i.e. the delta angle between successive rays.                                                                                                          |
| qc_procedures         |                  | string |           | Documents QC procedures per sweep.                                                                                                                                                                                                 |
| target_scan_rate      |                  | float  | degrees/s | Intended scan rate for this sweep. The actual scan rate is stored according to section 4.8.This variable is optional.Omit if not available.                                                                                        |
| scan_rate             | (time)           | float  | degrees/s | Actual antenna scan rate.Set to negative if counter-clockwise in azimuth or decreasing in elevation.Positive otherwise.                                                                                                            |
| azimuth               | (time)           | float  | degrees   | Azimuth of antenna, relative to true north.The azimuth should refer to the center of the dwell.                                                                                                                                    |
| elevation             | (time)           | float  | degrees   | Elevation of antenna, relative to the horizontal plane.The elevation should refer to the center of the dwell.                                                                                                                      |
| antenna_transition    | (time)           | byte   |           | 1 if antenna is in transition,i.e. between sweeps, 0 if not.If variable is omitted, the transition will be assumed to be 0 everywhere.Assumed 0 if missing.                                                                        |
| pulse_width           | (time)           | float  | seconds   |                                                                                                                                                                                                                                    |
| calib_index           | (time)           | int    |           | Index for the radar calibration that applies to this pulse width. See section 7.3.                                                                                                                                                 |
| rx_range_resolution   | (time)           | float  | meters    | Resolution of the raw receiver samples.If missing, assumed to be meters_between_gates (5.2.2).Raw data may be resampled before data storage.                                                                                       |
| prt                   | (time)           | float  | seconds   | Pulse repetition time.For staggered prt, also see prt_ratio.                                                                                                                                                                       |
| prt_ratio             | (time)           | float  |           | Ratio of prt/prt2.For dual/staggered prt mode.                                                                                                                                                                                     |
| prt_sequence          | (time, prt)      | float  | seconds   | Sequence of prts used.Optional for fixed, staggered and dual, which can make use of ‘prt’ and ‘prt_ratio’.Required for more complicated pulsing schemes.                                                                           |
| nyquist_velocity      | (time)           | float  | m/s       | Unambiguous velocity.This is the effective nyquist velocity after unfolding.See also the field-specific attributes fold_limit_lower and fold_limit_upper, 5.6.                                                                     |
| unambiguous_range     | (time)           | float  | meters    | Unambiguous range                                                                                                                                                                                                                  |
| n_samples             | (time)           | int    |           | Number of samples used to compute moments                                                                                                                                                                                          |
| spectrum_group_names  | (spectrum_group) | string |           | Array of names of spectrum groups.                                                                                                                                                                                                 |

The number of samples used to compute the moments may vary from field to field. In the table above, n_samples refers to the maximum number of samples used for any field. The field attribute ‘sampling_ratio’ (see 5.6) is the actual number of samples used for a given field, divided by n_samples. It will generally be 1.0, the default.

### Attributes for azimuth(time) variable

| Attribute name | Type   | Value                           |
| -------------- | ------ | ------------------------------- |
| standard_name  | string | “ray_azimuth_angle”             |
| long_name      | string | “azimuth angle from true north” |
| units          | string | “degrees”                       |
| axis           | string | “radial_azimuth_coordinate”     |

### Attributes for elevation(time) variable

| Attribute name | Type   | Value                                   |
| -------------- | ------ | --------------------------------------- |
| standard_name  | string | “ray_elevation_angle”                   |
| long_name      | string | “elevation angle from horizontal plane” |
| units          | string | “degrees”                               |
| axis           | string | “radial_elevation_coordinate”           |

## The _georeference_ sub-group

For _mobile_ platforms, this sub-group will be included in each sweep group, to store the metadata for platform position, pointing and velocity.

This group will always be named ‘_georeference’_.

| Variable name      | Dimension | Type   | Units         | Comments                                                                                                                                                                                                                                            |
| ------------------ | --------- | ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| latitude           | (time)    | double | degrees_north | Latitude of instrument.WGS84.                                                                                                                                                                                                                       |
| longitude          | (time)    | double | degrees_east  | Longitude of instrument.WGS84.                                                                                                                                                                                                                      |
| altitude           | (time)    | double | meters        | Altitude of instrument, above mean sea level. WGS84 with EGM2008 geoid corections.For a scanning radar, this is the center of rotation of the antenna.                                                                                              |
| heading            | (time)    | float  | degrees       | Heading of the platform relative to true N, looking down from above.                                                                                                                                                                                |
| roll               | (time)    | float  | degrees       | Roll about longitudinal axis of platform. Positive is left side up, looking forward.                                                                                                                                                                |
| pitch              | (time)    | float  | degrees       | Pitch about the lateral axis of the platform. Positive is up at the front.                                                                                                                                                                          |
| drift              | (time)    | float  | degrees       | Difference between heading and track over the ground. Positive drift implies track is clockwise from heading, looking from above. NOTE: not applicable to land-based mobile platforms.                                                              |
| rotation           | (time)    | float  | degrees       | Angle between the radar beam and the vertical axis of the platform. Zero is along the vertical axis, positive is clockwise looking forward from behind the platform.                                                                                |
| tilt               | (time)    | float  | degrees       | Angle between radar beam (when it is in a plane containing the longitudinal axis of the platform) and a line perpendicular to the longitudinal axis. Zero is perpendicular to the longitudinal axis, positive is towards the front of the platform. |
| eastward_velocity  | (time)    | float  | m/s           | EW velocity of the platform.Positive is eastwards.                                                                                                                                                                                                  |
| northward_velocity | (time)    | float  | m/s           | NS velocity of the platform.Positive is northwards.                                                                                                                                                                                                 |
| vertical_velocity  | (time)    | float  | m/s           | Vertical velocity of the platform. Positive is up.                                                                                                                                                                                                  |
| eastward_wind      | (time)    | float  | m/s           | EW wind at the platform location. Positive is eastwards.                                                                                                                                                                                            |
| northward_wind     | (time)    | float  | m/s           | NS wind at the platform location. Positive is northwards.                                                                                                                                                                                           |
| vertical_wind      | (time)    | float  | m/s           | Vertical wind at the platform location. Positive is up.                                                                                                                                                                                             |
| heading_rate       | (time)    | float  | degrees/s     | Rate of change of heading                                                                                                                                                                                                                           |
| roll_rate          | (time)    | float  | degrees/s     | Rate of change of roll of the platform                                                                                                                                                                                                              |
| pitch_rate         | (time)    | float  | degrees/s     | Rate of change of pitch of the platform.                                                                                                                                                                                                            |
| georefs_applied    | (time)    | byte   |               | 1 if georeference information for mobile platforms has been applied to correct the azimuth and elevation.0 otherwise.Assumed 0 if missing.                                                                                                          |

## The _monitoring sub-groups_

If monitoring data is available, this monitoring sub-groups will be included in each relevant sweep group, to store the monitoring variables.

The groups will be named ‘_radar_monitoring_’ and ‘_lidar_monitoring_’ depending on the instrument type. The variables included will be dependent on the particular instrument.

| Variable name                  | Dimension | Type  | Units   | Comments                                                                                                                         |
| ------------------------------ | --------- | ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| measured_transmit_power_h      | (time)    | float | dBm     | Measured transmit powerH polarization                                                                                            |
| measured_transmit_power_v      | (time)    | float | dBm     | Measured transmit powerV polarization                                                                                            |
| measured_sky_noise             | (time)    | float | dBm     | Noise measured at the receiver when connected to the antenna with no noise source connected.                                     |
| measured_cold_noise            | (time)    | float | dBm     | Noise measured at the receiver when connected to the noise source, but it is not enabled.                                        |
| measured_hot_noise             | (time)    | float | dBm     | Noise measured at the receiver when it is connected to the noise source and the noise source is on.                              |
| phase_difference_transmit_hv   | (time)    | float | degrees | Phase difference between transmitted horizontally and vertically-polarized signals as determined from the first valid range bins |
| antenna_pointing_accuracy_elev | (time)    | float | degrees | Antenna-pointing accuracy in elevation                                                                                           |
| antenna_pointing_accuracy_az   | (time)    | float | degrees | Antenna-pointing accuracy in azimuth                                                                                             |
| calibration_offset_h           | (time)    | float | dB      | Calibration offset for the horizontal channel                                                                                    |
| calibration_offset_v           | (time)    | float | dB      | Calibration offset for the vertical channel                                                                                      |
| zdr_offset                     | (time)    | float | dB      | ZDR offset (bias)                                                                                                                |

Radar monitoring variables.

## Field data variables

The field variables will be 2-dimensional arrays, with the dimensions **time** and **range**.

The field data will be stored using one of the following:

| NetCDF type | Byte width | Description             |
| ----------- | ---------- | ----------------------- |
| NC_UBYTE    | 1          | scaled unsigned integer |
| NC_BYTE     | 1          | scaled signed integer   |
| NC_USHORT   | 2          | scaled unsigned integer |
| NC_SHORT    | 2          | scaled signed integer   |
| NC_UINT     | 4          | scaled unsigned integer |
| NC_INT      | 4          | scaled signed integer   |
| NC_UINT64   | 8          | scaled unsigned integer |
| NC_INT64    | 8          | scaled signed integer   |
| NC_FLOAT    | 4          | floating point          |
| NC_DOUBLE   | 8          | floating point          |

The NetCDF variable name is interpreted as the short name for the field.

Field data variables have the following attributes:

| Attribute name                | Type                             | Convention | Description                                                                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| standard_name                 | string                           | CF         | CF standard name for field.See section 8.                                                                                                                                                                                                                     |
| long_name                     | string                           | CF         | Long name describing the field.Any string is appropriate.Although this is an optional attribute, its use is strongly encouraged.                                                                                                                              |
| Units                         | string                           | CF         | Units for field                                                                                                                                                                                                                                               |
| \_FillValue(or missing_value) | same type as field data          | CF         | Indicates data are missing at this range bin.Use of \_FillValue is preferred.Only use one or the other.                                                                                                                                                       |
| \_Undetect                    | same as field data               | ODIM       | Indicates an area (range bin) that has been radiated but has not produced a valid echo                                                                                                                                                                        |
| scale_factor                  | float                            | CF         | Float value =(integer value) \* scale_factor+ add_offsetOnly applies to integer types.Section 5.6.1.                                                                                                                                                          |
| add_offset                    | float                            | CF         | Float value =(integer value) \* scale_factor+ add_offsetOnly applies to integer types.Section 5.6.1.                                                                                                                                                          |
| coordinates                   | string                           | CF         | Section 5.6.2.                                                                                                                                                                                                                                                |
| sampling_ratio                | float                            | CF/Radial  | Number of samples for this field divided by n_samples(see section 5.3).Assumed 1.0 if missing.                                                                                                                                                                |
| is_discrete                   | string                           | CF/Radial  | “true” or “false”If “true”, this indicates that the field takes on discrete values, rather than floating point values. For example, if a field is used to indicate the hydrometeor type, this would be a discrete field.                                      |
| field_folds                   | string                           | CF/Radial  | “true” or “false”Used to indicate that a field is limited between a min and max value, and that it folds between the two extremes. This typically applies to such fields as radial velocity and PHIDP.                                                        |
| fold_limit_lower              | float                            | CF/Radial  | If field_folds is “true”, this indicates the lower limit at which the field folds.                                                                                                                                                                            |
| fold_limit_upper              | float                            | CF/Radial  | If field_folds is “true”, this indicates the upper limit at which the field folds.                                                                                                                                                                            |
| is_quality_field              | string                           | CF/Radial  | “true” or ”false”“true” indicates this is a quality control field.If the attribute is not present, defaults to “false”.                                                                                                                                       |
| flag_values                   | array of same type as field data | CF         | Array of flag values. These values have special meaning, as documented in flag_meanings.                                                                                                                                                                      |
| flag_meanings                 | string\[]                        | CF         | Meaning of flag_values or flag_masks.                                                                                                                                                                                                                         |
| flag_masks                    | array of same type as field data | CF         | Valid bit-wise masks used in a flag field that is comprised of bit-wise combinations of mask values.See flag_meanings.                                                                                                                                        |
| qualified_variables           | string\[]                        | CF/Radial  | Applicable if is_quality_field is “true”.Array list of variables that this variable qualifies.Every field variable in this list should list this variable in its ancillary_variable attribute.                                                                |
| ancillary_variables           | string\[]                        | CF         | Array list of variables to which this variable is related. In particular, this is intended to list the variables that contain quality information about this field. In that case, the quality field will list this field in its qualified_variable attribute. |
| thresholding_xml              | string                           | CF/Radial  | Thresholding details.Supplied if thresholding has been applied to the field.This should be in self-descriptive XML. (See 5.6.6.)                                                                                                                              |
| legend_xml                    | string                           | CF/Radial  | Legend details.Applies to discrete fields.Maps field values to the properties they represent.This should be in self-descriptive XML. (See 5.6.7.)Not sure what to do here.                                                                                    |

### Use of scale_factor and add_offset

scale_factor and add_offset are required for ncbyte, short and int fields. They are not applicable to float and double fields.

float_value = (integer_value \* scale_factor) + add_offset

### Use of coordinates attribute

The “coordinates’ attribute lists the variables needed to compute the location of a data point in space.

For stationary platforms, the coordinates attribute should be set to:

# “_elevation azimuth range_”

For mobile platforms, the coordinates attribute should be set to:

# “_elevation azimuth range heading roll pitch rotation tilt_”

### Use of flag values - optional

For all data sets, the \_**FillValue** attribute has special meaning – see 3.5.

A field variable may make use of more than one reserved value, to indicate a variety of conditions. For example, with radar data, you may wish to indicate that the beam is blocked for a given gate, and that no echo will ever be detected at that gate. That provides more information than just using \_**FillValue**.

The **flag_values** and **flag_meanings** attributes can be used in this case.

The **flag_values** attribute is a list of values (other than **\_FillValue**) that have special meanings. It should have the same type as the variable.

The **flag_meanings** string attribute is an array of strings that indicate the meanings of each of the **flag_values**. If multi-word meanings are needed, use underscores to connect the words. For example you might use flag meanings of ‘no_coverage’ and ‘low_snr’ to distinguish between regions where the radar cannot see as opposed to regions where the signal is well below the noise.

### Flag mask fields - optional

An integer-type field variable may contain values that describe a number of independent Boolean conditions. The field is constructed using the bit-wise OR method to combine the conditions.

In this case, the **flag_mask** and **flag_meanings** attributes are used to indicate the valid values in the field, and the meanings.

The **flag_masks** attribute is a list of integer values (other than **\_FillValue**) that are bit-wise combinations valid for the field variable. It should have the same type as the variable.

The **flag_meanings** string attribute is an array of strings that indicate the meanings of each of the **flag_masks**. If multi-word meanings are needed, use underscores to connect the words.

ODIM note - this mechanism can be used to indicate various conditions, such as no-echo etc. It is cleaner and more flexible than overloading the actual values in the data.

### Quality control fields - optional

Some field variables exist to provide quality information about another field variable. For example, one field may indicate the uncertainty associated with another field.

In this case, the field should have the **is_quality** string attribute, with the value set to “true”. If this attribute is missing, it is assumed to be “false”.

In addition, the field should have the **qualified_variables** string attribute. This is an array of field names that this field qualifies.

Each qualified field, in turn, should have the **ancillary_variables** string attribute. This is an array of fields that qualify it.

### Thresholding XML

The thresholding_xml should contain self-explanatory information about any thresholding that has been applied to the data field, as in the following example:

> &lt;thresholding field="DBZ">
>
> &lt;field_used>
>
> &lt;name>NCP&lt;/name>
>
> &lt;min_val>0.15&lt;/min_val>
>
> &lt;/field_used>
>
> &lt;field_used>
>
> &lt;name>SNR&lt;/name>
>
> &lt;min_val>-3.0&lt;/min_val>
>
> &lt;/field_used>
>
> &lt;note>NCP only checked if DBZ > 40&lt;/note>
>
> &lt;/thresholding>

### Legend XML

The legend_xml should contain self-explanatory information about the categories for a discrete field, as in the following example for particle type:

> &lt;legend label="particle_id">
>
> &lt;category>
>
> &lt;value>1&lt;/value>
>
> &lt;label>cloud&lt;/label>
>
> &lt;category>
>
> &lt;category>
>
> &lt;value>2&lt;/value>
>
> &lt;label>drizzle&lt;/label>
>
> &lt;category>
>
> .......
>
> .......
>
> &lt;category>
>
> &lt;value>17&lt;/value>
>
> &lt;label>ground_clutter&lt;/label>
>
> &lt;category>
>
> &lt;/legend>

# Spectrum groups

Because spectra are potentially voluminous, they are stored in a sparse array, such that a spectrum need only be stored for gate locations of interest, rather than at all locations. (For example, we may not store spectra for gates with low SNR.) This is achieved through the use of an integer ‘spectrum index’ variable, which exists for every gate location. If the index is set to -1, no spectrum is stored for that gate. If the index is 0 or positive, it indicates the location of the spectrum in the spectrum data array.

## Spectrum-specific information on sweep

If spectra are stored in a sweep, the sweep will define the following:

dimension _spectrum_group_ – the number of spectrum groups in the sweep;

variable _spectrum_group_names_(_spectrum_group_) – the names of the spectrum groups.

This array will allow the user to locate the spectrum groups in the sweep.

## _spectrum_index_ variable

Each spectrum group will contain a single _spectrum_index_ variable.

_spectrum_index_ is an integer variable, stored as a regular field data variable as specified in section 5.6 above. There is a spectrum index value for every gate in the sweep. The dimensions are:

_spectrum_index_(time, range)

just as for all field variables.

The \_FillValue attribute is set to -1.

If the index is missing for a gate, this indicates that there is no spectrum stored for that gate.

If the index is not missing for a gate, it will be set to a value between 0 and (index – 1). This value indicates the location for the spectrum in the spectrum field data variable array.

## Spectrum group dimensions

| Dimension name | Description                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| index          | Number of spectra stored in each spectrum variable in this group. This dimensions the number of indices used to locate the spectra, i.e. for the gates where the index is not -1. |
| sample         | Number of samples in the spectra.                                                                                                                                                 |

## Spectrum field variables

A spectrum variable will have the dimensions: (index, sample).

As with moments field variables, a spectrum variable will be stored using one of the following:

| NetCDF type | Byte width | Description           |
| ----------- | ---------- | --------------------- |
| ncbyte      | 1          | scaled signed integer |
| short       | 2          | scaled signed integer |
| int         | 4          | scaled signed integer |
| float       | 4          | floating point        |
| double      | 8          | floating point        |

## Spectrum field attributes

Spectrum fields have the following attributes:

| Attribute name               | Type                    | Convention | Description                                                                                                                      |
| ---------------------------- | ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| long_name                    | string                  | CF         | Long name describing the field.Any string is appropriate.Although this is an optional attribute, its use is strongly encouraged. |
| standard_name                | string                  | CF         | CF standard name for field, or from section 8.                                                                                   |
| units                        | string                  | CF         | Units for field                                                                                                                  |
| \_FillValue or missing_value | same type as field data | CF         | Indicates data are missing for a given sample. \_FillValue is preferred.                                                         |
| scale_factor                 | float                   | CF         | See section 5.6.Float value =(integer value) \* scale_factor+ add_offset.Only applied to integer types.                          |
| add_offset                   | float                   | CF         | See section 5.6.Float value =(integer value) \* scale_factor+ add_offset.Only applied to integer types.                          |
| coordinates                  | string                  | CF         | See section 5.6.2.                                                                                                               |
| fft_length                   | int                     | CF/Radial  | Length used to compute this spectrum                                                                                             |
| block_avg_length             | int                     | CF/Radial  | Number of block spectra averaged for each output spectrum.                                                                       |

# Root group metadata groups

The base _CF/Radial_ convention, as described above, covers the minimum set of NetCDF elements which are required to locate radar/lidar data in time and space.

Additional groups may be included to provide metadata on other aspects of the system.

These groups reside in the root group, and are optional.

## The _radar_parameters_ sub-group

This group holds radar parameters specific to a radar instrument:

| Variable name      | Dimension | Type  | Units   | Comments                            |
| ------------------ | --------- | ----- | ------- | ----------------------------------- |
| antenna_gain_h     | none      | float | dBi     | Nominal antenna gain,H polarization |
| antenna_gain_v     | none      | float | dBi     | Nominal antenna gain,V polarization |
| beam_width_h       | none      | float | degrees | Antenna beam widthH polarization    |
| beam_width_v       | none      | float | degrees | Antenna beam widthV polarization    |
| receiver_bandwidth | none      | float | s-1     | Bandwidth of radar receiver         |

## The _lidar_parameters_ sub-group

This group holds radar parameters specific to a lidar instrument:

| Variable name       | Dimension | Type  | Units        | Comments      |
| ------------------- | --------- | ----- | ------------ | ------------- |
| beam_divergence     | none      | float | milliradians | Transmit side |
| field_of_view       | none      | float | milliradians | Receive side  |
| aperture_diameter   | none      | float | cm           |               |
| aperture_efficiency | none      | float | percent      |               |
| peak_power          | none      | float | watts        |               |
| pulse_energy        | none      | float | joules       |               |

## The _radar_calibration_ sub-group

For a radar, **a different calibration is required for each pulse width. Therefore the calibration variables are arrays.**

### Dimensions

| Dimension name | Description                                |
| -------------- | ------------------------------------------ |
| calib          | The number of radar calibrations available |

### Variables

The meaning of the designations used in the calibration variables are as follows for dual-polarization radars:

-   '**h**': horizontal channel
-   '**v**': vertical channel
-   '**hc**': horizontal co-polar (h transmit, h receive)
-   '**hx**' – horizontal cross-polar (v transmit, h receive)
-   '**vc**': vertical co-polar (v transmit, v receive)
-   '**vx**' – vertical cross-polar (h transmit, v receive)

For single polarization radars, the '**h**' quantities should be used.

| Variable name            | Dimension | Type   | Units        | Comments                                                          |
| ------------------------ | --------- | ------ | ------------ | ----------------------------------------------------------------- |
| calib_index              | (calib)   | byte   |              | Calibration index for each ray.Assumed 0 if missing.              |
| time                     | (calib)   | string | UTC          | e.g. 2008-09-25T23:00:00Z                                         |
| pulse_width              | (calib)   | float  | seconds      | Pulse width for thiscalibration                                   |
| antenna_gain_h           | (calib)   | float  | dB           | Derived antenna gainH channel                                     |
| antenna_gain_v           | (calib)   | float  | dB           | Derived antenna gainV channel                                     |
| xmit_power_h             | (calib)   | float  | dBm          | Transmit powerH channel                                           |
| xmit_power_v             | (calib)   | float  | dBm          | Transmit powerV channel                                           |
| two_way_waveguide_loss_h | (calib)   | float  | dB           | 2-way waveguide lossmeasurement plane to feed horn, H channel     |
| two_way_waveguide_loss_v | (calib)   | float  | dB           | 2-way waveguide lossmeasurement plane to feed horn, V channel     |
| two_way_radome_loss_h    | (calib)   | float  | dB           | 2-way radome lossH channel                                        |
| two_way_radome_loss_v    | (calib)   | float  | dB           | 2-way radome lossV channel                                        |
| receiver_mismatch_loss   | (calib)   | float  | dB           | Receiver filter bandwidth mismatch loss                           |
| receiver_mismatch_loss_h | (calib)   | float  | dB           | Receiver filter bandwidth mismatch lossH channel                  |
| receiver_mismatch_loss_v | (calib)   | float  | dB           | Receiver filter bandwidth mismatch loss V channel                 |
| radar_constant_h         | (calib)   | float  | m/mWdB units | Radar constantH channel                                           |
| radar_constant_v         | (calib)   | float  | m/mWdB units | Radar constantV channel                                           |
| probert_jones_correction | (calib)   | float  | dB           | Probert Jones antenna correction factor.                          |
| dielectric_factor_used   | (calib)   | float  |              | This is \|K^2^\| in the radar equation                            |
| noise_hc                 | (calib)   | float  | dBm          | Measured noise levelH co-pol channel                              |
| noise_vc                 | (calib)   | float  | dBm          | Measured noise levelV co-pol channel                              |
| noise_hx                 | (calib)   | float  | dBm          | Measured noise levelH cross-pol channel                           |
| noise_vx                 | (calib)   | float  | dBm          | Measured noise levelV cross-pol channel                           |
| receiver_gain_hc         | (calib)   | float  | dB           | Measured receiver gainH co-pol channel                            |
| receiver_gain_vc         | (calib)   | float  | dB           | Measured receiver gainV co-pol channel                            |
| receiver_gain_hx         | (calib)   | float  | dB           | Measured receiver gainH cross-pol channel                         |
| receiver_gain_vx         | (calib)   | float  | dB           | Measured receiver gainV cross-pol channel                         |
| base_1km_hc              | (calib)   | float  | dBZ          | reflectivity at 1km for SNR=0dBnoise-correctedH co-pol channel    |
| base_1km_vc              | (calib)   | float  | dBZ          | reflectivity at 1km for SNR=0dBnoise-correctedV co-pol channel    |
| base_1km_hx              | (calib)   | float  | dBZ          | reflectivity at 1km for SNR=0dBnoise-correctedH cross-pol channel |
| base_1km_vx              | (calib)   | float  | dBZ          | reflectivity at 1km for SNR=0dBnoise-correctedV cross-pol channel |
| sun_power_hc             | (calib)   | float  | dBm          | Calibrated sun powerH co-pol channel                              |
| sun_power_vc             | (calib)   | float  | dBm          | Calibrated sun powerV co-pol channel                              |
| sun_power_hx             | (calib)   | float  | dBm          | Calibrated sun powerH cross-pol channel                           |
| sun_power_vx             | (calib)   | float  | dBm          | Calibrated sun powerV cross-pol channel                           |
| noise_source_power_h     | (calib)   | float  | dBm          | Noise source powerH channel                                       |
| noise_source_power_v     | (calib)   | float  | dBm          | Noise source powerV channel                                       |
| power_measure_loss_h     | (calib)   | float  | dB           | Power measurement loss in coax and connectorsH channel            |
| power_measure_loss_v     | (calib)   | float  | dB           | Power measurement loss in coax and connectorsV channel            |
| coupler_forward_loss_h   | (calib)   | float  | dB           | Coupler loss into waveguideH channel                              |
| coupler_forward_loss_v   | (calib)   | float  | dB           | Coupler loss into waveguideV channel                              |
| zdr_correction           | (calib)   | float  | dB           | corrected =measured + correction                                  |
| ldr_correction_h         | (calib)   | float  | dB           | corrected =measured + correction                                  |
| ldr_correction_v         | (calib)   | float  | dB           | corrected =measured + correction                                  |
| system_phidp             | (calib)   | float  | degrees      | System PhiDp, as seen in drizzle close to radar                   |
| test_power_h             | (calib)   | float  | dBm          | Calibration test powerH channel                                   |
| test_power_v             | (calib)   | float  | dBm          | Calibration test powerV channel                                   |
| receiver_slope_hc        | (calib)   | float  |              | Computed receiver slope, ideally 1.0H co-pol channel              |
| receiver_slope_vc        | (calib)   | float  |              | Computed receiver slope, ideally 1.0V co-pol channel              |
| receiver_slope_hx        | (calib)   | float  |              | Computed receiver slope, ideally 1.0H cross-pol channel           |
| receiver_slope_vx        | (calib)   | float  |              | Computed receiver slope, ideally 1.0V cross-pol channel           |

## The _lidar_calibration_ sub-group

At the time of writing, the contents of this group have not been defined.

## The _georeference_correction_ sub-group

The following additional variables are used to quantify errors in the georeference data for moving platforms (see 5.4). These are constant for a volume.

If any item is omitted, the value is assumed to be 0.

| Variable name                     | Dimension | Type  | Units   | Comments                               |
| --------------------------------- | --------- | ----- | ------- | -------------------------------------- |
| azimuth_correction                | none      | float | degrees | Correction to azimuth values           |
| elevation_correction              | none      | float | degrees | Correction to elevation values         |
| range_correction                  | none      | float | meters  | Correction to range values             |
| longitude_correction              | none      | float | degrees | Correction to longitude values         |
| latitude_correction               | none      | float | degrees | Correction to latitude values          |
| pressure_altitude_correction      | none      | float | meters  | Correction to pressure altitude values |
| radar_altitude_correction         | none      | float | meters  | Correction to radar altitude values    |
| eastward_ground_speed_correction  | none      | float | m/s     | Correction to EW ground speed values   |
| northward_ground_speed_correction | none      | float | m/s     | Correction to NS ground speed values   |
| vertical_velocity_correction      | none      | float | m/s     | Correction to vertical velocity values |
| heading_correction                | none      | float | degrees | Correction to heading values           |
| roll_correction                   | none      | float | degrees | Correction to roll values              |
| pitch_correction                  | none      | float | degrees | Correction to pitch values             |
| drift_correction                  | none      | float | degrees | Correction to drift values             |
| rotation_correction               | none      | float | degrees | Correction to rotation values          |
| tilt_correction                   | none      | float | degrees | Correction to tilt values              |

# Standard names

To the extent possible, CfRadial uses standard names already defined by CF.

The standard_name entries not already accepted by CF have been requested for inclusion.

The relevant standard names for radar and lidar data will be specified in a separate document.

# Computing the data location from geo-reference variables

Weather radars and lidars rotate primarily about a _principal axis_ (e.g., “zenith” for plan-position-indicator mode in ground-based radar), slew about a secondary axis, orthogonal to the primary axis (e.g., range-height-indicator in ground-based radar), or slew on a plane by changing both primary and secondary axis (e.g., COPLANE in ground-based radar).

In the ground-based radar convention, a point in space relative to a radar is represented in a local spherical coordinate systems **X**~i~ by three parameters, range (_r_), azimuth (_λ_), and elevation (_φ_). A ground-based radar is assumed “leveled” with positive (negative) elevation, _φ_, above (below) a _reference plane_ (a leveled plane orthogonal to the principal axis and containing the radar). The azimuth angle, _λ_, is the angle on the reference plane increases clockwise from the True North (TN) following the Meteorological coordinate convention (e.g., TN is 0° and East is 90°).

Processing and manipulating radar data (e.g., interpolation, synthesis, etc.) typically are performed in a right-handed 3-D XYZ Cartesian geo-referenced coordinate system **X** (see Fig. 7.1) where Y is TN and X is East. Hence, a coordinate transformation between **X**~i~ (radar sampling space) and **X** (geo-reference space) is required. Based on the principal axes, most remote sensors can be classified into three right-hand types, X, Y, or Z type.

The purpose of this chapter is two-fold: (1) to define a consistent terminology for the CfRadial format, and (2) to derive coordinate transformation matrices for each type of remote sensor. Many sensors (e.g. fixed ground radars) are of the Z-type, have a fixed location, are leveled and are aligned relative to True North (TN). Dealing with such sensors is much simpler than for those on moving platforms. Therefore, they will be dealt with first, and the more complicated treatment of all three types of remote sensor mounted on moving platforms will be covered in the later sections.

Figure .: Left-handed XYZ coordinate system vs. Right-handed XYZ coordinate system.

In addition to the standard X, Y and Z right-hand types, specialized types such as the ELDORA and NOAA aircraft tail radars will be handled separately. The tail radars will be referred to as type Y-prime.

## Special case – ground-based, stationary and leveled sensors

Ground-based sensors (radars and lidars) rotate primarily about the vertical (Z) axis (Z-Type), and the reference plane is a horizontal XY plane passing through the sensor. The Y-axis is aligned with TN, and the X-axis points East.

Azimuth angles (_λ_) are positive clockwise looking from above (+Z), with 0 being TN.

Elevation angles (_φ_) are measured relative to the horizontal reference plane, positive above the plane and negative below it.

A ground-based, leveled vertical pointing sensor can be classified as a Z-Type with φ=90°.

### LIDARs![](data:image/wmf;base64,183GmgAAAAAAACABwAEECQAAAAD1XgEACQAAA7oAAAAAAGwAAAAAAAUAAAACAQEAAAAFAAAAAQL///8ABQAAAC4BGQAAAAUAAAALAgAAAAAFAAAADALAASABEwAAACYGDwAcAP////8AAE4AEAAAAMD///+m////4AAAAGYBAAALAAAAJgYPAAwATWF0aFR5cGUAACAAbAAAACYGDwDNAE1hdGhUeXBlVVXBAAUBAAUCRFNNVDUAARNXaW5BbGxCYXNpY0NvZGVQYWdlcwARBVRpbWVzIE5ldyBSb21hbgARA1N5bWJvbAARBUNvdXJpZXIgTmV3ABEETVQgRXh0cmEAEgAIIS9Fj0QvQVD0EA9HX0FQ8h8eQVD0FQ9BAPRF9CX0j0JfQQD0EA9DX0EA9I9F9CpfSPSPQQD0EA9A9I9Bf0j0EA9BKl9EX0X0X0X0X0EPDAEAAQABAgICAgACAAEBAQADAAEABAAACgAACwAAACYGDwAMAP////8BAAAAAAAAAAMAAAAAAA==)

For LIDARs, the assumption is generally made that propagation of the beam is along a straight line, emanating at the sensor. The coordinate transformation between **X**~i~ (_r_, _λ_, _φ_) and **X** (_x_, _y_, _z_) is as follows:

where

_x_ is positive east

_y_ is positive north

(_x_~0~, _y_~0~, _z_~0~) are the coordinates of the sensor relative to the Cartesian grid origin and the azimuth angle (_λ_) is the angle clockwise from TN.

The sensor location is specified in longitude, latitude and altitude in the CfRadial format. Locations in the earth’s geo-reference coordinate system are computed using the sensor location and the (_x_,_y_,_z_) from above, using normal spherical geometry.

### RADARs

The propagation of radar microwave energy in a beam through the lower atmosphere is affected by the change of refractive index of the atmosphere with height. Under average conditions this causes the beam to be deflected downwards, in what is termed ‘Standard Refraction’. For most purposes this is adequately modeled by assuming that the beam is in fact straight, relative to an earth which has a radius of 4/3 times the actual earth radius. (Rinehart 2004.)

For a stationary and leveled, ground-based radar, the equations are similar to those for the LIDAR case, except that we have one extra term, the height correction, which reflects the beam curvature relative to the earth.

The height _h_ above the earth’s surface for a given range is:

figure:
:::
![](data:image/wmf;base64,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)
:::

where is the pseudo radius of earth. See Rinehart 2004, Chapter 3, for more details.

The (_x_,_y_) location for a given range is:

where _x_ is positive east, _y_ is positive north, and remembering that azimuth is the angle clockwise from true north.

## Moving platforms

For moving platforms, the metadata for each beam will include:

-   longitude of instrument
-   latitude of instrument
-   altitude of instrument
-   rotation and tilt of the beam (see above)
-   roll, pitch and heading of the platform
-   platform motion (U~G~, V~G~, W~G~)
-   air motion (U~air~, V~air~, W~air~)

For ground-based moving platforms (e.g., Doppler on Wheels), the earth-relative location of the observed point is:

Note that for airborne radar platforms, correcting for refractive index does not apply. Therefore, for airborne radars, use the straight line equations for LIDARs.

Refer to the sections below for the computation of elevation (_φ_) and azimuth (_λ_) relative to earth coordinates.

Then apply the following equations, as before, to compute the location of the observed point.

## Coordinate transformations for the general case

This section details the processing for the general case.

Sensors which do not fall under section 7.1 above must be handled as a general case.

### Coordinate systems

In addition to the previously-defined **X~i~** and **X** coordinate systems, the following intermediate right-handed coordinate systems need to be defined to account for a moving, non-leveled platform:

-   **X**~a~: platform-relative coordinates, +Y points to heading, +X points to the right side (90° clockwise from +Y on the reference plane XY), +Z is orthogonal to the reference plane.
-   **X**~h~ : leveled, platform heading-relative coordinates, +Y points heading, +X points 90° clockwise from heading, and Z points up (local zenith).

The goal here is to derive transformations from **X~i~** to **X** via **X**~a~ and **X**~h~.

### The earth-relative coordinate system

The earth-relative coordinate system, **X**, is defined as follows, X is East, Y is North, and Z is zenith. Azimuth angle, _λ_, is defined as positive _clockwise_ from TN (i.e., meteorological angle) while elevation angle, _φ_, is defined positive/negative above/below the horizontal plane at the altitude (_h_~0~) of the remote sensor.

### The platform-relative coordinate system

The general form of the mathematic representation describes a remote sensing device mounted on a moving platform (e.g., an aircraft, see Figure 7.2). This figure depicts the theoretical reference frame for a moving platform. (We use the aircraft analogy here, but the discussion also applies to water-borne platforms and land-based moving platforms.)

The platform-relative coordinate system of the platform, **X**~a~, is defined by the right side, (X~a~), the heading, (Y~a~), and the zenith, (Z~a~).

The origin of **X**~a~ is defined as the location of the INS on a moving platform.

The platform-relative coordinate system is defined by 3 rotations in the following order: heading (_H_), pitch (_P_) and roll (_R_) angles from **X**. These angles are generally measured by an inertial navigation system (INS).

The platform moves relative to **X**, based on its heading _H_, and the drift _D_, caused by wind or current. (_D_ is 0 for land-based platforms). The track _T_ is the line of the platform movement over the earth surface.

NOTE: -see Lee et al. (1994) for further background on this topic, and on the corrections to Doppler velocity for moving platforms. Usually, the platform INS and the sensor may not be collocated. The Doppler velocity needs to be compensated by the relative motion between these two.

figure:
:::
![](data:image/png;base64,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)

Figure . Moving platform axis definitions and reference frame (reproduced from Lee et al., 1994,originally from Axford, 1968) ©American Meteorological Society. Reprinted with permission.
:::

Figures 7.3 a through c show the definitions of heading, drift, track, pitch and roll.

Figure 9.3(a): Definition of heading, drift and track.

Figure 9.3(b): Definition of pitch

Figure 9.3(c): Definition of roll

### The sensor coordinate system

In the sensor coordinate system, **X**~i~, each data location is characterized by a range, _r_, a rotation angle, _θ_, and a tilt angle, _τ_. Following the ground-based radar convention, the rotation angle, _θ_, is the angle projected on the reference plane, positive _clockwise_ from the third axis (counting from the principal axis in **X**~a~) looking _towards the sensor_ from the positive principal axis. The tilt angle, _τ_, is the angle of the beam relative to the reference plane. A beam has a positive/negative _τ_ depending on whether it is on the positive/negative side of the reference plane, using the principal axis to determine the sign. Each gate location (_r_, _θ_, _τ_) in **X**~i~ can be represented in (_r_, _λ_, _φ_) in **X**.

table:
:::
Table .: Characteristics of 4 types of sensors.

| Sensor Type        | Type X                                                                           | Type Y   | Type Y-prime                                       | Type Z                                                                                           |
| ------------------ | -------------------------------------------------------------------------------- | -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Principal Axis     | X~a~                                                                             | Y~a~     | Ya                                                 | Z~a~                                                                                             |
| Reference Plane    | Y~a~Z~a~                                                                         | Z~a~X~a~ | ZaXa                                               | X~a~Y~a~                                                                                         |
| 0° Rotation Angle  | +Z~a~                                                                            | +X~a~    | +Za                                                | +Y~a~                                                                                            |
| 90° Rotation Angle | +Y~a~                                                                            | +Z~a~    | +Xa                                                | +X~a~                                                                                            |
| Examples           | EDOP, Wyoming Cloud Radar, Wind Profiler, downward scanning radar on Global Hawk |          | Tail Doppler radars on NOAA P3 and NSF/NCAR ELDORA | Ground-based radar/lidar, aircraft nose radar, NOAA P3 lower-fuselage radar,C-band scatterometer |
:::

## Coordinate transformation sequence

The following transformations are carried out to transform the geometry from the instrument-based (**X**~i~) to the earth-based coordinate system (**X**):

-   translate from **X**~i~ to **X**~a~
-   rotate from **X**~a~ to **X**

### Transformation from X~i~ to X~a~

The details of this step depend on the sensor type: Z, Y or X (Table 7.1)

#### Type Z sensors

The characteristics are:

-   the primary axis is Z~a~
-   the reference plane is (X~a~, Y~a~)
-   the rotation angle _θ_ is 0 in the (Y~a~, Z~a~) plane, i.e. along the +Y axis. Rotation increases clockwise from +Y, when looking from above (i.e. from +Z)
-   the tilt angle _τ_ is 0 in the (X~a~, Y~a~) plane, positive above it (for +Z~a~) and negative below it.

The transformation to Χ~a~ coordinates is:

#### Type Y sensors 

The characteristics are:

-   the primary axis is Y~a~
-   the reference plane is (Z~a~, X~a~)
-   the rotation angle _θ_ is 0 in the (Z~a~, X~a~) plane, i.e. along the +X~a~ axis. Rotation increases clockwise from +X, when looking from +Y.
-   the tilt angle _τ_ is 0 in the (Z~a~, X~a~) plane, positive for +Y~a~.

_**Note that the definition of**_!number(0)_**θ is different from the convention defined in Lee et al. (1994)**_!null_**. Let θ’ be the rotation angle defined in Lee et al. (1994), θ=mod(450°- θ’).**_

The transformation to **Χ**~a~ coordinates is:

1.  > **Type Y-prime sensors**

The characteristics are:

> the primary axis is Y~a~
>
> the reference plane is (Z~a~, X~a~)
>
> the rotation angle _θ_ is 0 in the (Ya, Za) plane, i.e. along the +Z~a~ axis. Rotation increases clockwise from +Z, when looking from -Y.
>
> the tilt angle _τ_ is 0 in the (Z~a~, X~a~) plane, positive for +Y~a~.

_**Note that the definition of**_!number(0)_**θ is the convention defined in Lee et al. (1994**_

The transformation to **Χ**~a~ coordinates is:

#### Type X sensors 

The characteristics are:

-   the primary axis is X~a~
-   the reference plane is (Y~a~, Z~a~)
-   the rotation angle _θ_ is 0 in the (Y~a~, Z~a~) plane, i.e. along the +Z~a~ axis. Rotation increases clockwise from +Z~a~, when looking from +X~a~.
-   the tilt angle _τ_ is 0 in the (Y~a~, Z~a~) plane, positive for +X~a~.

The transformation to Χ~a~ coordinates is:

### Rotating from X~a~ to X

Rotating **X**~a~ to **X** requires the following 3 steps (in the reverse order of the rotation):

-   remove the roll _R_, by rotating the x axis around the y axis by –_R_.
-   remove the pitch _P_, by rotating the y axis around the x axis by –_P_.
-   remove the heading _H_, by rotating the y axis around the z axis by +_H_

The transformation matrix for removing the roll component is:

The transformation matrix for removing the pitch component is:

The transformation matrix for removing the heading component is:

We apply these transformations consecutively:

## Summary of transforming from X~i~ to X

We combine the above 2 main steps for transform all the way from the instrument coordinates to earth coordinates:

### For type Z radars:

### For type Y radars:

### For type Y-prime radars:

### For type X radars:

### Computing earth-relative azimuth and elevation

We can then compute the earth-relative azimuth and elevation as follows:

## Summary of symbol definitions

> **Χ**~i~: instrument-relative coordinate system, (_r_, _θ_, _τ_) or (_r_, _λ_, _φ_)
>
> **Χ**~a~: platform-relative coordinate system (_x_~a~, _y_~a~, _z_~a~) – see figure 7.2
>
> **Χ**~h~: coordinate system relative to level platform (no roll or pitch) with heading _H_.
>
> **Χ**: earth-relative coordinate system (_x_, _y_, _z_), _x_ is positive east, _y_ is positive north, _z_ is positive up.
>
> _H_: heading of platform (see figure 7.3)
>
> _T_: track of platform (see figure 7.3)
>
> _D_: drift angle (see figure 7.3)
>
> _P_: pitch angle (see figure 7.3)
>
> _R_: roll angle (see figure 7.3)
>
> _λ_: azimuth angle
>
> _φ_: elevation angle
>
> _θ_: rotation angle
>
> _τ_: tilt angle
>
> _r_: range

_h_: height

_h_~0:~ height of the instrument

> _R_’: pseudo radius of earth = ![](data:image/wmf;base64,183GmgAAAAAAAOAIgAL/CAAAAACOVQEACQAAA9IBAAACAI0AAAAAAAUAAAACAQEAAAAFAAAAAQL///8ABQAAAC4BGQAAAAUAAAALAgAAAAAFAAAADAKAAuAIEwAAACYGDwAcAP////8AAE4AEAAAAMD///+j////oAgAACMCAAALAAAAJgYPAAwATWF0aFR5cGUAAHAABQAAAAkCAAAAAgUAAAAUArwBLgAcAAAA+wIJ/uMAAAAAAJABAAAAAQACABBTeW1ib2wAAHYLCnZAQMR3pOESABaWwXdAQMR3ugtmNwQAAAAtAQAACQAAADIKAAAAAAEAAAAoeQAABQAAABQCvAEtAxwAAAD7Agn+4wAAAAAAkAEAAAABAAIAEFN5bWJvbAAAFQgK0kBAxHek4RIAFpbBd0BAxHe6C2Y3BAAAAC0BAQAEAAAA8AEAAAkAAAAyCgAAAAABAAAAKXkAAAUAAAAUAqABzQAcAAAA+wKA/gAAAAAAAJABAAAAAAACABBUaW1lcyBOZXcgUm9tYW4A/N0SABaWwXdAQMR3ugtmNwQAAAAtAQAABAAAAPABAQASAAAAMgoAAAAABwAAADQvMzYzNzQA9gCiAHEBwADAAMAAAAMFAAAAFAKgAdwGHAAAAPsCgP4AAAAAAACQAQEAAAAAAgAQVGltZXMgTmV3IFJvbWFuAADeEgAWlsF3QEDEd7oLZjcEAAAALQEBAAQAAADwAQAACgAAADIKAAAAAAIAAABrbagAAAONAAAAJgYPABABTWF0aFR5cGVVVQQBBQEABQJEU01UNQAAE1dpbkFsbEJhc2ljQ29kZVBhZ2VzABEFVGltZXMgTmV3IFJvbWFuABEDU3ltYm9sABEFQ291cmllciBOZXcAEQRNVCBFeHRyYQASAAghL0WPRC9BUPQQD0dfQVDyHx5BUPQVD0EA9EX0JfSPQl9BAPQQD0NfQQD0j0X0Kl9I9I9BAPQQD0D0j0F/SPQQD0EqX0RfRfRfRfRfQQ8MAQABAAECAgICAAIAAQEBAAMAAQAEAAAKAQADAAEDAAEAAgCINAACAIIvAAIAiDMAAAIAligAAgCWKQAAAgCINgACAIgzAAIAiDcAAgCINAACAINrAAIAg20AAAALAAAAJgYPAAwA/////wEAAAAAAAAAHAAAAPsCEAAHAAAAAAC8AgAAAAABAgIiU3lzdGVtADe6C2Y3AAAKACEAigEAAAAAAAAAAEzoEgAEAAAALQEAAAQAAADwAQEAAwAAAAAA)
