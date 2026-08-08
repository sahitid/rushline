-- Demo roster: grow Berkeley Consulting to ~40 members for Chaos mode.
-- Safe to re-run (skips names that already exist).

insert into members (club_id, name, role, linkedin_url, instagram, email, career_tags, relevance, is_alumni)
select c.id, v.name, v.role, v.linkedin_url, v.instagram, v.email, v.career_tags, v.relevance, v.is_alumni
from clubs c
cross join (values
('Marcus Lee','Project Lead','https://www.linkedin.com/in/marcuslee-bc','@marcus.lee','marcus.lee@berkeley.edu',array['consulting','big_tech'],'Leads the Google engagement — good if you want the tech-consulting angle.',false),
('Sofia Ortega','Alumni Relations','https://www.linkedin.com/in/sofiaortega','@sofia.o','sofia.ortega@berkeley.edu',array['consulting'],'Went BC -> McKinsey. Perfect for MBB-track advice and referrals.',true),
('Aiden Park','Case Coach','https://www.linkedin.com/in/aidenpark','@aiden.park','aiden.park@berkeley.edu',array['consulting'],'Owns the interview rubric. Ask him what separates a strong case from an average one.',false),
('Elena Vasquez','Engagement Manager','https://www.linkedin.com/in/elenavasquez','@elena.v','elena.vasquez@berkeley.edu',array['consulting','finance'],'Ran the Kaiser Permanente case — strong ops + healthcare angle.',false),
('Noah Chen','Analyst','https://www.linkedin.com/in/noahchen-bc','@noah.chen','noah.chen@berkeley.edu',array['consulting'],'First-year who just survived recruiting — freshest tips on the process.',false),
('Maya Thompson','Social Chair','https://www.linkedin.com/in/mayathompson','@maya.t','maya.thompson@berkeley.edu',array['consulting'],'Knows the culture side — Tahoe retreats, formals, who actually shows up.',false),
('Rohan Desai','VP Client Relations','https://www.linkedin.com/in/rohandesai','@rohan.d','rohan.desai@berkeley.edu',array['consulting','startups'],'Pitches clients every semester — great for talking about sales + consulting.',false),
('Grace Kim','Project Lead','https://www.linkedin.com/in/gracekim-bc','@grace.kim','grace.kim@berkeley.edu',array['consulting','big_tech'],'Leads Salesforce engagement. Strong product + strategy crossover.',false),
('Lucas Wright','Treasurer','https://www.linkedin.com/in/lucaswright','@lucas.w','lucas.wright@berkeley.edu',array['finance','consulting'],'Handles budget + sponsorships — useful for finance-curious recruits.',false),
('Amara Johnson','Mentor Lead','https://www.linkedin.com/in/amarajohnson','@amara.j','amara.johnson@berkeley.edu',array['consulting'],'Pairs new members with alums. Best intro into the alumni network.',false),
('Ethan Brooks','Analyst','https://www.linkedin.com/in/ethanbrooks','@ethan.b','ethan.brooks@berkeley.edu',array['consulting'],'Just finished a Bay Area startup case — good for startup + consulting mix.',false),
('Chloe Nguyen','Design Lead','https://www.linkedin.com/in/chloenguyen','@chloe.n','chloe.nguyen@berkeley.edu',array['consulting','startups'],'Owns deck polish and storytelling. Ask how they sell recommendations.',false),
('Jay Patel','VP Ops','https://www.linkedin.com/in/jaypatel-bc','@jay.patel','jay.patel@berkeley.edu',array['consulting'],'Keeps engagements on rails. Knows the weekly time commitment for real.',false),
('Isabella Cruz','Recruiting Coordinator','https://www.linkedin.com/in/isabellacruz','@isa.cruz','isabella.cruz@berkeley.edu',array['consulting'],'Screens apps with Daniel — knows what gets you past resume round.',false),
('Owen Sullivan','Alumni','https://www.linkedin.com/in/owensullivan','@owen.s','owen.sullivan@berkeley.edu',array['consulting','finance'],'BC -> Bain. Good cold-chat if you want T2/MBB placement stories.',true),
('Nadia Rahman','Project Lead','https://www.linkedin.com/in/nadiarahman','@nadia.r','nadia.rahman@berkeley.edu',array['consulting'],'Nonprofit + mid-market cases. Soft skills + structured thinking.',false),
('Ben Zhao','Quant Lead','https://www.linkedin.com/in/benzhao','@ben.zhao','ben.zhao@berkeley.edu',array['quant','consulting'],'Runs market sizing workshops — perfect for case math anxiety.',false),
('Harper Ellis','Analyst','https://www.linkedin.com/in/harperellis','@harper.e','harper.ellis@berkeley.edu',array['consulting'],'Sophomore who just got in — ask what prep actually mattered.',false),
('Kai Nakamura','Tech Lead','https://www.linkedin.com/in/kainakamura','@kai.n','kai.nakamura@berkeley.edu',array['big_tech','consulting'],'Bridges BC and tech recruiting. Google + Meta alum intros.',false),
('Lila Brooks','Communications','https://www.linkedin.com/in/lilabrooks','@lila.b','lila.brooks@berkeley.edu',array['consulting'],'Writes club newsletters and LinkedIn posts — knows the public brand vs reality.',false),
('Sam Okonkwo','Engagement Manager','https://www.linkedin.com/in/samokonkwo','@sam.o','sam.okonkwo@berkeley.edu',array['consulting','finance'],'Led Levi Strauss case. Retail + brand strategy angle.',false),
('Zoe Mitchell','Analyst','https://www.linkedin.com/in/zoemitchell','@zoe.m','zoe.mitchell@berkeley.edu',array['consulting'],'Active in case prep DeCal — can mock with you before interviews.',false),
('Derek Huang','VP Strategy','https://www.linkedin.com/in/derekhuang','@derek.h','derek.huang@berkeley.edu',array['consulting','startups'],'Thinks about club roadmap. Good for "why BC over Voyager" questions.',false),
('Fatima Alvi','Project Lead','https://www.linkedin.com/in/fatimaalvi','@fatima.a','fatima.alvi@berkeley.edu',array['consulting'],'Healthcare + public sector cases. Mission-driven consulting path.',false),
('Ryan O''Connor','Alumni','https://www.linkedin.com/in/ryanoconnor','@ryan.oc','ryan.oconnor@berkeley.edu',array['consulting'],'BC -> Deloitte S&A. Useful if you''re open to Big 4 strategy.',true),
('Sienna Park','Social Chair','https://www.linkedin.com/in/siennapark','@sienna.p','sienna.park@berkeley.edu',array['consulting'],'Plans Friday socials — culture fit questions go through her.',false),
('Mateo Rivera','Analyst','https://www.linkedin.com/in/mateorivera','@mateo.r','mateo.rivera@berkeley.edu',array['consulting','finance'],'Econ + Haas dual. Good for finance-to-consulting pivots.',false),
('Avery Collins','Case Coach','https://www.linkedin.com/in/averycollins','@avery.c','avery.collins@berkeley.edu',array['consulting'],'Coaches group case rounds. Knows what collaboration looks like live.',false),
('Kenji Sato','Project Lead','https://www.linkedin.com/in/kenjisato','@kenji.s','kenji.sato@berkeley.edu',array['consulting','big_tech'],'Data-heavy cases. Ask about Excel/SQL expectations before interviews.',false),
('Olivia Grant','Mentor','https://www.linkedin.com/in/oliviagrant','@olivia.g','olivia.grant@berkeley.edu',array['consulting'],'Assigned mentors for new members — can explain onboarding culture.',false),
('Tyler Brooks','Analyst','https://www.linkedin.com/in/tylerbrooks','@tyler.b','tyler.brooks@berkeley.edu',array['consulting'],'Transfer who got in — unique perspective on late-start recruiting.',false),
('Ananya Iyer','VP Academics','https://www.linkedin.com/in/ananyaiyer','@ananya.i','ananya.iyer@berkeley.edu',array['consulting'],'Runs internal trainings. Ask what frameworks they actually use on clients.',false),
('Chris Delaney','Alumni','https://www.linkedin.com/in/chrisdelaney','@chris.d','chris.delaney@berkeley.edu',array['consulting','finance'],'BC -> PE associate. For folks eyeing consulting then buyside.',true),
('Jade Nguyen','Analyst','https://www.linkedin.com/in/jadenguyen','@jade.n','jade.nguyen@berkeley.edu',array['consulting'],'Current junior. Honest about hours during active engagements.',false),
('Miles Foster','Client Relations','https://www.linkedin.com/in/milesfoster','@miles.f','miles.foster@berkeley.edu',array['consulting','startups'],'Sources startup clients. Good if you want founder-facing work.',false),
('Rachel Kim','Project Lead','https://www.linkedin.com/in/rachelkim-bc','@rachel.k','rachel.kim@berkeley.edu',array['consulting'],'Leads BART District engagement — public sector + ops.',false)
) as v(name, role, linkedin_url, instagram, email, career_tags, relevance, is_alumni)
where c.slug = 'berkeley-consulting'
  and not exists (
    select 1 from members m where m.club_id = c.id and m.name = v.name
  );
