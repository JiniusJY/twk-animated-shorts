# Grounding ledger, 23 November 2026

- adidas announcement,1 July2022, primary manufacturer. https://news.adidas.com/football/adidas-reveals-the-first-fifa-world-cup--official-match-ball-featuring-connected-ball-technology/s/cccb7187-a67c-4166-b57d-2b28f1d36fa0 . Central suspension stabilises500HzIMU, movement information sent to video officials, unclear-touch assistance. High confidence.
- TDK technology explainer, component manufacturer. https://www.tdk.com/en/tech-mag/sportstech/002 . Accelerometers measure acceleration, gyroscopes angular velocity;2022ball measures both500times/sec. High confidence on physical principles; do not adopt promotional claims of eliminated errors.
- FIFA technical workflow, governing-body documentation. https://inside.fifa.com/en/innovation/world-cup-2022/semi-automated-offside-technology . Ball timing combined with camera limb positions; officials manually validate suggested kick point/offside line and can override. High confidence. This is OFFSIDE workflow, not proof all stages were used in Ronaldo goal-credit case.
- CBS Sports29Nov2022, independent report quoting adidas viaFIFA. https://www.cbssports.com/soccer/news/fifa-2022-world-cup-cristiano-ronaldo-didnt-score-portugals-opening-goal-vs-uruguay-according-to-adidas/ . Goal Bruno, adidas reports no measured external force during Ronaldo attempt. Reporter5000Hztypo rejected in favour of500Hzquote/primary.
- Indian Express30Nov2022, independent technical explainer. https://indianexpress.com/article/explained/explained-sports/fifa-world-cup-portugal-uruguay-cristiano-ronaldo-goal-8297606/ . Sudden acceleration signal/touch explanation and Ronaldo no-contact evidence. Secondary corroboration, not source of invented waveform.
- KINEXON8Dec2022, system vendor. https://kinexon-sports.com/blog/everything-you-need-to-know-about-ball-tracking/ . IMU versus separate UWBposition subsystem distinction. Marketing combines full-system capabilities; never attribute player identity or position directly to IMU alone. Do not equate sample interval with end-to-end certainty.

# Calculation
1000ms /500samples per second =2ms per sample. Computed locally. This is sampling interval, not guaranteed timing error, latency or a referee verdict every2ms.

# Chosen explanation
Suspension -> acceleration/rotation signals -> discrete samples -> change can indicate touch -> attributed Ronaldo no-force statement -> explicitly separate offside fusion workflow -> human interpretation.

# Exclusions
No live or fabricated match trace, no exact engineering dimensions, no claim chip identifies the player alone, no claim any signal change always equals player contact, no automatic foul or goal decision.
