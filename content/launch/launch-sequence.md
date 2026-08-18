# RaceIQ launch sequence

A suggested order for publishing the launch package. Each step links to its file in this same content/launch/ directory. Bryan approves and schedules each post manually -- nothing here posts automatically.

1. **Day 1 -- LinkedIn** (`launch-linkedin.md`): the founder story post. Why RaceIQ exists, what it demonstrates, one real finding from Abu Dhabi Grand Prix, link to the site.
2. **Day 1 -- X thread** (`launch-x.md`): same story, condensed to a 4-tweet thread.
3. **Day 2 -- Instagram** (`launch-instagram.md`): visual-first caption, pair with `content/generated/2021-abu-dhabi-grand-prix/insight-card-pace.png`.
4. **Day 2 -- Facebook** (`launch-facebook.md`): broader/more casual framing for a general audience.
5. **Day 3 -- Short video** (`launch-video-outline.md`): record and post an unscripted 30-60s video following the outline; caption it with a shortened version of the LinkedIn post.
6. **Ongoing** -- once the launch package has run, use `scripts\build-race-content.ps1 -Year <year> -Event "<event>"` to generate a fresh content package for any of the other 19 races and continue posting on a regular cadence.

Every post links to https://raceiq.crouchdevelopment.com. No post claims a specific driver "won" the race -- RaceIQ's data covers pace, consistency, and closing-pace evidence only, not finishing order.
