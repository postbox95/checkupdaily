-- ============ roles & profiles ============
create type public.app_role as enum ('admin','editor','user');

create table public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile write" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "roles readable by self and admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ updated_at helper ============
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ============ thanas ============
create table public.thanas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.thanas to anon;
grant select, insert, update, delete on public.thanas to authenticated;
grant all on public.thanas to service_role;
alter table public.thanas enable row level security;
create policy "thanas public read" on public.thanas for select to anon, authenticated using (true);
create policy "thanas admin write" on public.thanas for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger thanas_touch before update on public.thanas for each row execute function public.touch_updated_at();

-- ============ diagnostic centers ============
create table public.diagnostic_centers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  branch_name text not null default '',
  thana text not null default '',
  city text not null default 'Dhaka',
  address text not null default '',
  latitude double precision not null default 23.78,
  longitude double precision not null default 90.4,
  contact_phone text not null default '',
  sample_collection_fee integer not null default 0,
  home_sample_available boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.diagnostic_centers to anon;
grant select, insert, update, delete on public.diagnostic_centers to authenticated;
grant all on public.diagnostic_centers to service_role;
alter table public.diagnostic_centers enable row level security;
create policy "centers public read" on public.diagnostic_centers for select to anon, authenticated using (true);
create policy "centers admin write" on public.diagnostic_centers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger centers_touch before update on public.diagnostic_centers for each row execute function public.touch_updated_at();

-- ============ medical tests ============
create table public.medical_tests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  canonical_name text not null,
  bangla_name text not null default '',
  category text not null default 'PATHOLOGY',
  synonyms text[] not null default '{}',
  description text not null default '',
  preparation_note text not null default '',
  fasting_required boolean not null default false,
  fasting_hours integer,
  report_delivery_hrs integer not null default 24,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.medical_tests to anon;
grant select, insert, update, delete on public.medical_tests to authenticated;
grant all on public.medical_tests to service_role;
alter table public.medical_tests enable row level security;
create policy "tests public read" on public.medical_tests for select to anon, authenticated using (true);
create policy "tests admin write" on public.medical_tests for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger tests_touch before update on public.medical_tests for each row execute function public.touch_updated_at();

-- ============ test prices (interconnection) ============
create table public.test_prices (
  id uuid primary key default gen_random_uuid(),
  medical_test_id uuid not null references public.medical_tests(id) on delete cascade,
  diagnostic_center_id uuid not null references public.diagnostic_centers(id) on delete cascade,
  price integer not null default 0,
  discounted_price integer,
  notes text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medical_test_id, diagnostic_center_id)
);
grant select on public.test_prices to anon;
grant select, insert, update, delete on public.test_prices to authenticated;
grant all on public.test_prices to service_role;
alter table public.test_prices enable row level security;
create policy "prices public read" on public.test_prices for select to anon, authenticated using (true);
create policy "prices admin write" on public.test_prices for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger prices_touch before update on public.test_prices for each row execute function public.touch_updated_at();
create index test_prices_test_idx on public.test_prices(medical_test_id);
create index test_prices_center_idx on public.test_prices(diagnostic_center_id);

-- ============ site settings ============
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
create policy "settings admin write" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

-- ============ seed: thanas ============
insert into public.thanas (name, latitude, longitude, sort_order) values
  ('Dhanmondi',23.7461,90.3760,1),
  ('Panthapath',23.7514,90.3899,2),
  ('Green Road',23.7513,90.3841,3),
  ('Mirpur-10',23.8069,90.3687,4),
  ('Uttara Sector 3',23.8697,90.3968,5),
  ('Mogbazar',23.7477,90.4062,6),
  ('Shantinagar',23.7396,90.4111,7),
  ('Bashundhara R/A',23.8151,90.4258,8);

-- ============ seed: centers ============
insert into public.diagnostic_centers (slug,name,branch_name,thana,city,address,latitude,longitude,contact_phone,sample_collection_fee,home_sample_available,sort_order) values
 ('c1','Popular Diagnostic Centre','Dhanmondi Branch (Unit 1)','Dhanmondi','Dhaka','House 16, Road 2, Dhanmondi',23.7461,90.3760,'+8809613787801',110,true,1),
 ('c2','Popular Diagnostic Centre','Shantinagar Branch (Unit 2)','Shantinagar','Dhaka','House 25, Chamelibagh, Shantinagar',23.7396,90.4111,'+8809613787802',130,true,2),
 ('c3','Labaid Diagnostics','Dhanmondi (Road 4)','Dhanmondi','Dhaka','House 6, Road 4, Dhanmondi',23.7391,90.3823,'+8801766662001',150,true,3),
 ('c4','Labaid Diagnostics','Uttara Branch','Uttara Sector 3','Dhaka','House 1, Road 7, Sector 3, Uttara',23.8697,90.3968,'+8801766662002',150,false,4),
 ('c5','Ibn Sina Diagnostic Centre','Green Road Unit','Green Road','Dhaka','House 68, Green Road, Dhanmondi',23.7513,90.3841,'+8801717351631',100,true,5),
 ('c6','Ibn Sina Diagnostic Centre','Mirpur-10 Unit','Mirpur-10','Dhaka','Plot 22, Block C, Mirpur-10',23.8069,90.3687,'+8801717351632',90,true,6),
 ('c7','Praava Health','Banani Family Health Centre','Bashundhara R/A','Dhaka','Block E, Bashundhara R/A',23.8151,90.4258,'+8801088888',200,true,7),
 ('c8','Medinova Medical Services','Panthapath Branch','Panthapath','Dhaka','House 71/A, Panthapath',23.7514,90.3899,'+8809666787801',120,false,8),
 ('c9','Medinova Medical Services','Mogbazar Branch','Mogbazar','Dhaka','Outer Circular Road, Mogbazar',23.7477,90.4062,'+8809666787802',120,true,9);

-- ============ seed: tests ============
insert into public.medical_tests (code,canonical_name,bangla_name,category,synonyms,fasting_required,fasting_hours,report_delivery_hrs,is_popular,sort_order) values
 ('TEST-CBC','Complete Blood Count (CBC)','সম্পূর্ণ রক্ত পরীক্ষা','PATHOLOGY',array['CBC','CBC with ESR','TC DC ESR','blood test','rokto porikkha','রক্ত পরীক্ষা','sardi','jor'],false,null,6,true,1),
 ('TEST-LIPID','Lipid Profile','লিপিড প্রোফাইল','PATHOLOGY',array['lipid','cholesterol','TG HDL LDL','cholesterol test','চর্বি পরীক্ষা'],true,12,12,true,2),
 ('TEST-HBA1C','HbA1c (Glycated Haemoglobin)','এইচবিএ১সি','PATHOLOGY',array['HbA1c','A1c','3 months sugar','diabetes test','ডায়াবেটিস পরীক্ষা'],false,null,24,true,3),
 ('TEST-FBS','Fasting Blood Sugar (FBS)','খালি পেটে রক্তের সুগার','PATHOLOGY',array['FBS','fasting sugar','khali pete sugar','সুগার','glucose fasting'],true,8,4,false,4),
 ('TEST-RBS','Random Blood Sugar (RBS)','যেকোনো সময়ের রক্তের সুগার','PATHOLOGY',array['RBS','random sugar','2hrs ABF','sugar test','সুগার টেস্ট'],false,null,4,false,5),
 ('TEST-CREAT','Serum Creatinine','সিরাম ক্রিয়েটিনিন','PATHOLOGY',array['creatinine','S. Creatinine','kidney test','কিডনি পরীক্ষা'],false,null,6,true,6),
 ('TEST-TSH','Serum TSH','সিরাম টিএসএইচ','PATHOLOGY',array['TSH','thyroid','থাইরয়েড'],false,null,24,false,7),
 ('TEST-CRP','C-Reactive Protein (CRP)','সি-রিঅ্যাকটিভ প্রোটিন','PATHOLOGY',array['CRP','inflammation','thrust','sardi jor','সর্দি জ্বর'],false,null,8,false,8),
 ('TEST-URINE','Urine R/M/E','প্রস্রাব পরীক্ষা','PATHOLOGY',array['urine','R/M/E','urine test','prosrab porikkha','প্রস্রাব'],false,null,6,false,9),
 ('TEST-SGPT','SGPT (ALT)','এসজিপিটি','PATHOLOGY',array['SGPT','ALT','liver test','লিভার পরীক্ষা'],false,null,8,false,10),
 ('TEST-USG-ABD','Ultrasonography of Whole Abdomen (USG)','আল্ট্রাসনোগ্রাফি (পুরো পেট)','RADIOLOGY',array['USG','ultrasound','ultrasonography','আল্ট্রাসনোগ্রাফি','pete ultrasound'],true,6,3,true,11),
 ('TEST-XRAY-CHEST','X-Ray Chest P/A View','বুকের এক্স-রে','RADIOLOGY',array['x-ray','chest x ray','CXR','এক্স-রে'],false,null,3,false,12),
 ('TEST-ECG','ECG (Electrocardiogram)','ইসিজি','CARDIOLOGY',array['ECG','EKG','heart test','হৃদপিণ্ড পরীক্ষা'],false,null,1,true,13),
 ('TEST-ECHO','Echocardiogram (Colour Doppler)','ইকোকার্ডিওগ্রাম','CARDIOLOGY',array['ECHO','echocardiography','heart echo','ইকো'],false,null,4,false,14),
 ('TEST-CT-BRAIN','CT Scan of Brain','ব্রেইন সিটি স্ক্যান','RADIOLOGY',array['CT','CT scan','brain CT','সিটি স্ক্যান'],false,null,12,false,15),
 ('TEST-MRI-BRAIN','MRI of Brain','ব্রেইন এমআরআই','RADIOLOGY',array['MRI','brain MRI','এমআরআই'],false,null,24,false,16),
 ('TEST-ENDO','Upper GI Endoscopy','এন্ডোস্কপি','ENDOSCOPY',array['endoscopy','UGI endoscopy','এন্ডোস্কপি'],true,8,2,false,17);

-- ============ seed: price matrix ============
with base(code, amount) as (values
 ('TEST-CBC',400),('TEST-LIPID',1200),('TEST-HBA1C',1100),('TEST-FBS',180),('TEST-RBS',180),
 ('TEST-CREAT',500),('TEST-TSH',900),('TEST-CRP',900),('TEST-URINE',300),('TEST-SGPT',450),
 ('TEST-USG-ABD',1400),('TEST-XRAY-CHEST',500),('TEST-ECG',300),('TEST-ECHO',2000),
 ('TEST-CT-BRAIN',5000),('TEST-MRI-BRAIN',9000),('TEST-ENDO',3500)),
factor(slug, f) as (values
 ('c1',1.00),('c2',1.05),('c3',1.15),('c4',1.12),('c5',0.92),('c6',0.88),('c7',1.35),('c8',0.97),('c9',0.95)),
skipped(slug, code) as (values
 ('c6','TEST-MRI-BRAIN'),('c6','TEST-ENDO'),('c8','TEST-MRI-BRAIN'),('c8','TEST-CT-BRAIN'),
 ('c9','TEST-ECHO'),('c9','TEST-MRI-BRAIN'),('c7','TEST-ENDO'),('c4','TEST-CT-BRAIN'),('c2','TEST-MRI-BRAIN')),
disc(slug, code) as (values
 ('c1','TEST-LIPID'),('c1','TEST-CBC'),('c5','TEST-USG-ABD'),('c5','TEST-HBA1C'),('c9','TEST-CBC'),('c3','TEST-ECHO'))
insert into public.test_prices (medical_test_id, diagnostic_center_id, price, discounted_price, notes)
select mt.id, dc.id,
  (round((b.amount * f.f) / 10) * 10)::int,
  case when exists (select 1 from disc d where d.slug = dc.slug and d.code = mt.code)
       then (round(((round((b.amount * f.f) / 10) * 10) * 0.85) / 10) * 10)::int end,
  case when mt.code in ('TEST-CT-BRAIN','TEST-MRI-BRAIN') then 'Excludes contrast medium charge' end
from public.medical_tests mt
join base b on b.code = mt.code
cross join public.diagnostic_centers dc
join factor f on f.slug = dc.slug
where not exists (select 1 from skipped s where s.slug = dc.slug and s.code = mt.code);

-- ============ seed: settings ============
insert into public.site_settings (key, value) values
 ('general', jsonb_build_object(
   'siteName','Niramoy Prices',
   'tagline','Compare diagnostic test prices across Dhaka',
   'heroTitleEn','Know the real price before you test',
   'heroTitleBn','পরীক্ষার আগেই আসল দাম জানুন',
   'heroSubEn','Compare diagnostic test prices across Dhaka labs — including needle, tube and registration charges.',
   'heroSubBn','ঢাকার ডায়াগনস্টিক সেন্টারগুলোর দাম তুলনা করুন — সব চার্জসহ।',
   'defaultThana','Dhanmondi',
   'defaultLang','en',
   'currencySymbol','৳',
   'supportPhone','',
   'metaDescription','Compare CBC, USG, Lipid Profile and more across Dhaka diagnostic centres. See real totals including needle & registration charges.'
 ));