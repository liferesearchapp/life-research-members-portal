/****** Object:  Table [dbo].[account]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[account](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[login_email] [nvarchar](255) NOT NULL,
	[microsoft_id] [nvarchar](255) NULL,
	[first_name] [nvarchar](255) NOT NULL,
	[last_name] [nvarchar](255) NOT NULL,
	[is_admin] [bit] NOT NULL,
 CONSTRAINT [PK_account] PRIMARY KEY CLUSTERED 
(
	[id] ASC
),
 CONSTRAINT [UK_login_email] UNIQUE NONCLUSTERED 
(
	[login_email] ASC
)
)
/****** Object:  Table [dbo].[current_promotion_strategy]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[current_promotion_strategy](
	[member_id] [int] NOT NULL,
	[promotion_strategy_id] [int] NOT NULL,
 CONSTRAINT [PK_current_promotion_strategy] PRIMARY KEY CLUSTERED 
(
	[member_id] ASC,
	[promotion_strategy_id] ASC
)
)
/****** Object:  Table [dbo].[desired_promotion_strategy]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[desired_promotion_strategy](
	[member_id] [int] NOT NULL,
	[promotion_strategy_id] [int] NOT NULL,
 CONSTRAINT [PK_desired_promotion_strategy] PRIMARY KEY CLUSTERED 
(
	[member_id] ASC,
	[promotion_strategy_id] ASC
)
)
/****** Object:  Table [dbo].[external_partnership]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[external_partnership](
	[member_id] [int] NOT NULL,
	[organization_id] [int] NOT NULL,
	[description] [nvarchar](max) NULL,
 CONSTRAINT [PK_external_partnership] PRIMARY KEY CLUSTERED 
(
	[member_id] ASC,
	[organization_id] ASC
)
)
/****** Object:  Table [dbo].[faculty]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[faculty](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NOT NULL,
	[name_fr] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_faculty] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[has_keyword]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[has_keyword](
	[member_id] [int] NOT NULL,
	[keyword_id] [int] NOT NULL,
 CONSTRAINT [PK_has_keyword] PRIMARY KEY CLUSTERED 
(
	[member_id] ASC,
	[keyword_id] ASC
)
)
/****** Object:  Table [dbo].[insight]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[insight](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[member_id] [int] NOT NULL,
	[interview_date] [date] NULL,
	[about_member] [nvarchar](max) NULL,
	[about_promotions] [nvarchar](max) NULL,
	[dream] [nvarchar](max) NULL,
	[how_can_we_help] [nvarchar](max) NULL,
	[other_notes] [nvarchar](max) NULL,
 CONSTRAINT [PK_insight] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[keyword]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[keyword](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NULL,
	[name_fr] [nvarchar](255) NULL,
 CONSTRAINT [PK_keyword] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[member]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[member](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[account_id] [int] NOT NULL,
	[faculty_id] [int] NULL,
	[type_id] [int] NULL,
	[work_email] [nvarchar](255) NULL,
	[work_phone] [nchar](50) NULL,
	[about_me] [nvarchar](max) NULL,
	[website_link] [nvarchar](4000) NULL,
	[twitter_link] [nvarchar](4000) NULL,
	[linkedin_link] [nvarchar](4000) NULL,
	[cv_link] [nvarchar](4000) NULL,
	[address] [nvarchar](255) NULL,
	[city] [nvarchar](255) NULL,
	[province] [nvarchar](255) NULL,
	[country] [nvarchar](255) NULL,
	[postal_code] [nvarchar](255) NULL,
	[date_joined] [date] NULL,
	[is_active] [bit] NOT NULL,
	[last_active] [date] NULL,
 CONSTRAINT [PK_member] PRIMARY KEY CLUSTERED 
(
	[id] ASC
),
 CONSTRAINT [UK_account_id] UNIQUE NONCLUSTERED 
(
	[account_id] ASC
)
)
/****** Object:  Table [dbo].[member_type]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[member_type](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NOT NULL,
	[name_fr] [nvarchar](255) NOT NULL,
 CONSTRAINT [PK_member_type] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[org_scope]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[org_scope](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NULL,
	[name_fr] [nvarchar](255) NULL,
 CONSTRAINT [PK_org_scope] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[org_type]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[org_type](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NULL,
	[name_fr] [nvarchar](255) NULL,
 CONSTRAINT [PK_org_type] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[organization]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[organization](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NULL,
	[name_fr] [nvarchar](255) NULL,
	[scope_id] [int] NOT NULL,
	[type_id] [int] NOT NULL,
	[description] [nvarchar](4000) NULL,
 CONSTRAINT [PK_organization] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[problem]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[problem](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](4000) NULL,
	[name_fr] [nvarchar](4000) NULL,
 CONSTRAINT [PK_problem] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[promotion_strategy]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[promotion_strategy](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NULL,
	[name_fr] [nvarchar](255) NULL,
 CONSTRAINT [PK_promotion_strategy] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)
)
/****** Object:  Table [dbo].[works_on]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE TABLE [dbo].[works_on](
	[member_id] [int] NOT NULL,
	[problem_id] [int] NOT NULL,
 CONSTRAINT [PK_works_on] PRIMARY KEY CLUSTERED 
(
	[member_id] ASC,
	[problem_id] ASC
)
)
/****** Object:  Index [UK_microsoft_id]    Script Date: 2022-10-18 5:59:32 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UK_microsoft_id] ON [dbo].[account]
(
	[microsoft_id] ASC
)
WHERE ([microsoft_id] IS NOT NULL)
ALTER TABLE [dbo].[account] ADD  CONSTRAINT [DF_account_is_admin]  DEFAULT ((0)) FOR [is_admin]
ALTER TABLE [dbo].[member] ADD  CONSTRAINT [DF_member_is_active]  DEFAULT ((1)) FOR [is_active]
ALTER TABLE [dbo].[current_promotion_strategy]  WITH CHECK ADD  CONSTRAINT [FK_current_promotion_strategy_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ALTER TABLE [dbo].[current_promotion_strategy] CHECK CONSTRAINT [FK_current_promotion_strategy_member_id]
ALTER TABLE [dbo].[current_promotion_strategy]  WITH CHECK ADD  CONSTRAINT [FK_current_promotion_strategy_promotion_strategy_id] FOREIGN KEY([promotion_strategy_id])
REFERENCES [dbo].[promotion_strategy] ([id])
ALTER TABLE [dbo].[current_promotion_strategy] CHECK CONSTRAINT [FK_current_promotion_strategy_promotion_strategy_id]
ALTER TABLE [dbo].[desired_promotion_strategy]  WITH CHECK ADD  CONSTRAINT [FK_desired_promotion_strategy_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ALTER TABLE [dbo].[desired_promotion_strategy] CHECK CONSTRAINT [FK_desired_promotion_strategy_member_id]
ALTER TABLE [dbo].[desired_promotion_strategy]  WITH CHECK ADD  CONSTRAINT [FK_desired_promotion_strategy_promotion_strategy_id] FOREIGN KEY([promotion_strategy_id])
REFERENCES [dbo].[promotion_strategy] ([id])
ALTER TABLE [dbo].[desired_promotion_strategy] CHECK CONSTRAINT [FK_desired_promotion_strategy_promotion_strategy_id]
ALTER TABLE [dbo].[external_partnership]  WITH CHECK ADD  CONSTRAINT [FK_external_partnership_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ALTER TABLE [dbo].[external_partnership] CHECK CONSTRAINT [FK_external_partnership_member_id]
ALTER TABLE [dbo].[external_partnership]  WITH CHECK ADD  CONSTRAINT [FK_external_partnership_organization_id] FOREIGN KEY([organization_id])
REFERENCES [dbo].[organization] ([id])
ALTER TABLE [dbo].[external_partnership] CHECK CONSTRAINT [FK_external_partnership_organization_id]
ALTER TABLE [dbo].[has_keyword]  WITH CHECK ADD  CONSTRAINT [FK_has_keyword_keyword_id] FOREIGN KEY([keyword_id])
REFERENCES [dbo].[keyword] ([id])
ALTER TABLE [dbo].[has_keyword] CHECK CONSTRAINT [FK_has_keyword_keyword_id]
ALTER TABLE [dbo].[has_keyword]  WITH CHECK ADD  CONSTRAINT [FK_has_keyword_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ALTER TABLE [dbo].[has_keyword] CHECK CONSTRAINT [FK_has_keyword_member_id]
ALTER TABLE [dbo].[insight]  WITH CHECK ADD  CONSTRAINT [FK_insight_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
ALTER TABLE [dbo].[insight] CHECK CONSTRAINT [FK_insight_member_id]
ALTER TABLE [dbo].[member]  WITH CHECK ADD  CONSTRAINT [FK_member_account_id] FOREIGN KEY([account_id])
REFERENCES [dbo].[account] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
ALTER TABLE [dbo].[member] CHECK CONSTRAINT [FK_member_account_id]
ALTER TABLE [dbo].[member]  WITH CHECK ADD  CONSTRAINT [FK_member_faculty_id] FOREIGN KEY([faculty_id])
REFERENCES [dbo].[faculty] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
ALTER TABLE [dbo].[member] CHECK CONSTRAINT [FK_member_faculty_id]
ALTER TABLE [dbo].[member]  WITH CHECK ADD  CONSTRAINT [FK_member_type_id] FOREIGN KEY([type_id])
REFERENCES [dbo].[member_type] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
ALTER TABLE [dbo].[member] CHECK CONSTRAINT [FK_member_type_id]
ALTER TABLE [dbo].[organization]  WITH CHECK ADD  CONSTRAINT [FK_organization_scope_id] FOREIGN KEY([scope_id])
REFERENCES [dbo].[org_scope] ([id])
ALTER TABLE [dbo].[organization] CHECK CONSTRAINT [FK_organization_scope_id]
ALTER TABLE [dbo].[organization]  WITH CHECK ADD  CONSTRAINT [FK_organization_type_id] FOREIGN KEY([type_id])
REFERENCES [dbo].[org_type] ([id])
ALTER TABLE [dbo].[organization] CHECK CONSTRAINT [FK_organization_type_id]
ALTER TABLE [dbo].[works_on]  WITH CHECK ADD  CONSTRAINT [FK_works_on_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[member] ([id])
ALTER TABLE [dbo].[works_on] CHECK CONSTRAINT [FK_works_on_member_id]
ALTER TABLE [dbo].[works_on]  WITH CHECK ADD  CONSTRAINT [FK_works_on_problem_id] FOREIGN KEY([problem_id])
REFERENCES [dbo].[problem] ([id])
ALTER TABLE [dbo].[works_on] CHECK CONSTRAINT [FK_works_on_problem_id]
ALTER TABLE [dbo].[keyword]  WITH CHECK ADD  CONSTRAINT [CK_keyword_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[keyword] CHECK CONSTRAINT [CK_keyword_has_name]
ALTER TABLE [dbo].[org_scope]  WITH CHECK ADD  CONSTRAINT [CK_org_scope_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[org_scope] CHECK CONSTRAINT [CK_org_scope_has_name]
ALTER TABLE [dbo].[org_type]  WITH CHECK ADD  CONSTRAINT [CK_org_type_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[org_type] CHECK CONSTRAINT [CK_org_type_has_name]
ALTER TABLE [dbo].[organization]  WITH CHECK ADD  CONSTRAINT [CK_organization_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[organization] CHECK CONSTRAINT [CK_organization_has_name]
ALTER TABLE [dbo].[problem]  WITH CHECK ADD  CONSTRAINT [CK_problem_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[problem] CHECK CONSTRAINT [CK_problem_has_name]
ALTER TABLE [dbo].[promotion_strategy]  WITH CHECK ADD  CONSTRAINT [CK_promotion_strategy_has_name] CHECK  (([name_en] IS NOT NULL AND [name_en]<>'' OR [name_fr] IS NOT NULL AND [name_fr]<>''))
ALTER TABLE [dbo].[promotion_strategy] CHECK CONSTRAINT [CK_promotion_strategy_has_name]
