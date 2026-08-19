---
title: How far behind the index is
summary: Hours since the last sync. Everything else here is only as true as this.
metric: staleness
as: number
draft: false
---

Every other insight reads the projection, and the projection is rebuilt from
files by a command somebody runs. So this is the number that qualifies all the
others: an answer computed against a six-hour-old index is a six-hour-old
answer, however precise it looks.

Under an hour, the index and the repository agree. Past a working day it is
usually a sync somebody forgot rather than a repository nobody touched - the
Workflows section runs one.
