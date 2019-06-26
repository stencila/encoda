# Sexual dimorphism among a Chihuahuan Desert rodent community

# Introduction

Ernest et al (2016) provide data from a long term study of a Chihuahuan desert ecosystem near Portal, Arizona which began in 1977. Twenty four experimental plots were established and divided among controls and experimental manipulations. Experimental manipulations included removal of all or some rodent species, all or some ants, seed additions, and various alterations of the annual plant community

This example document analyses sexual dimorphism in weight. Sexual dimorphism is the difference in morphology between male and female members of the same species. As with all the example's in this repository, this is a very simple analysis meant to illustrate a very simple scientific paper - please refer to to the original paper and peer reviewed analyses of the data.

# Methods

The data were obtained from the _weecology_ [Portal Github repository](https://github.com/weecology/PortalData/tree/master/Rodents) on 5 September 2017. Ernest et al (2016) describe the data and how it was collected,

> At this site, 24 experimental plots were established and divided among controls and experimental manipulations. Experimental manipulations over the years include removal of all or some rodent species, all or some ants, seed additions, and various alterations of the annual plant community. This dataset includes data previously available through an older data publication and adds 11 years of data. It also includes additional ant and weather data not previously available. These data have been used in a variety of publications documenting the effects of the experimental manipulations as well as the response of populations and communities to long-term changes in climate and habitat. Sampling is ongoing and additional data will be published in the future.

| A   | B   | C   |
| --- | --- | --- |
| 1   | 2   | 3   |
| 4   | 5   | 6   |

```r
library(dplyr)
library(reshape2)

# Read in data from the directory where you've downloaded the files, likely not 'home/nokome' :)
temp <- read.csv('/home/nokome/stencila/source/examples/rodents/Portal_rodent.csv.gz')
species <- read.csv('/home/nokome/stencila/source/examples/rodents/Portal_rodent_species.csv', na.strings = '')
# Create factor with species name labels
temp$species <- factor(temp$species, levels=species$speciescode, labels=species$scientificname)
# Restrict to records with male or female and weight recorded
temp <- subset(temp, sex %in% c('M', 'F') & !is.na(wgt))
# Restrict to top five species
top5 <- temp %>% group_by(species) %>% count() %>% arrange(-n) %>% head(5) %>% .$species
rodents <<- subset(temp, species %in% top5)
nrow(rodents)
```

The data were restricted to records where weight was available and sex was recorded as M (male) or F (female). The data were further restricted to the top five species by number resulting in a data set with `n` records (Table 1).

**Table 1: Number of individuals of each species weighed over all years**

```r
rodents %>% group_by(species) %>% count() %>% arrange(-n) %>% rename('Species'=species, 'Individuals'=n)
```

# Results

Initial examination of the data suggested that sexual dimorphism varied across the species examined with the degree of sexual dimorphism being greatest for _D. merriami_ and _C. baileyi_(Figure 1). Over all years of data, _C. baileyi_ had the highest ratio between mean male weight and female weight and _O.torridus_ had the lowest (Table 2).

```r
rodents %>%
    group_by(species, sex) %>%
    ggplot(aes(x=wgt, fill=sex)) +
        geom_density(alpha=0.5) +
        facet_wrap(~species, scales='free_x') +
        labs(x='Weight (g)', y='Density', fill='Sex')
```

**Figure 1. Distributions of individual weights by species.**

**Table 2. Mean weight (g) by sex for each species and the ratio of male weight over female weight across all years.**

```r
rodents %>%
    group_by(species, sex) %>%
    summarise(mean_wgt=round(mean(wgt,na.rm=T),2)) %>%
    dcast(species~sex) %>%
    mutate(ratio=round(M/F,2)) %>%
    rename('Species'=species,'Female'=F, 'Male'=M)
```

There is evidence of changes in mean weight over time (Figure 2). Although their are fluctations in the ratio of male:female mean weights, there are no apparent trends. However, it is notable that for _C.baileyi_ the ratio was substantially higher during the 2000s than in the previous decade (Figure 3).

```r
rodents %>%
    group_by(year,species) %>%
    summarise(mean_wgt=mean(wgt,na.rm=T), sd_wgt=sd(wgt,na.rm=T)) %>%
    ggplot(aes(x=year,y=mean_wgt)) +
        geom_point() + geom_line() +
        geom_errorbar(aes(ymin=mean_wgt-sd_wgt, ymax=mean_wgt+sd_wgt)) +
        facet_wrap(~species, scales='free_y') +
        labs(x='Year', y='Weight (g)')
```

**Figure 2. Changes in mean weight (both sexes combined) over time for each rodent species. Error bars indicate +/- one standard deviation.**

```r
rodents %>%
    group_by(year,species,sex) %>%
    summarise(mean_wgt=mean(wgt,na.rm=T)) %>%
    dcast(species+year~sex) %>%
    mutate(ratio=round(M/F,2)) %>%
    ggplot(aes(x=year,y=ratio,color=species)) +
        geom_point(alpha=0.7,size=2) + geom_line(alpha=0.7) +
        labs(x='Year',y='Ratio of mean weights M/F', colour='Species')
```

**Figure 3. Changes in ratio of mean male weight to mean female weight for each rodent species.**

# References

Ernest, S. K., et al. Long‐term monitoring and experimental manipulation of a Chihuahuan desert ecosystem near Portal, Arizona (1977–2013). _Ecology_ 97.4 (2016): 1082-1082.
