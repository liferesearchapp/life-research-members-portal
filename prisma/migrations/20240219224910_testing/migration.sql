BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[account] (
    [id] INT NOT NULL IDENTITY(1,1),
    [login_email] NVARCHAR(255) NOT NULL,
    [microsoft_id] NVARCHAR(255),
    [first_name] NVARCHAR(255) NOT NULL,
    [last_name] NVARCHAR(255) NOT NULL,
    [is_admin] BIT NOT NULL CONSTRAINT [DF_account_is_admin] DEFAULT 0,
    [last_login] DATE,
    CONSTRAINT [PK_account] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UK_login_email] UNIQUE NONCLUSTERED ([login_email])
);

-- CreateTable
CREATE TABLE [dbo].[current_promotion_strategy] (
    [member_id] INT NOT NULL,
    [promotion_strategy_id] INT NOT NULL,
    CONSTRAINT [PK_current_promotion_strategy] PRIMARY KEY CLUSTERED ([member_id],[promotion_strategy_id])
);

-- CreateTable
CREATE TABLE [dbo].[desired_partnership] (
    [id] INT NOT NULL,
    [member_id] INT NOT NULL,
    [type_id] INT,
    [scope_id] INT,
    [description] VARCHAR(max),
    CONSTRAINT [PK_desired_partnership] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UK_desired_partnership_member_id] UNIQUE NONCLUSTERED ([member_id])
);

-- CreateTable
CREATE TABLE [dbo].[desired_promotion_strategy] (
    [member_id] INT NOT NULL,
    [promotion_strategy_id] INT NOT NULL,
    CONSTRAINT [PK_desired_promotion_strategy] PRIMARY KEY CLUSTERED ([member_id],[promotion_strategy_id])
);

-- CreateTable
CREATE TABLE [dbo].[event] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(2000) NOT NULL,
    [name_fr] NVARCHAR(2000) NOT NULL,
    [start_date] DATE,
    [end_date] DATE,
    [event_type_id] INT,
    [topic_id] INT,
    [note] NVARCHAR(max),
    CONSTRAINT [PK_event] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[event_event] (
    [previous_event_id] INT NOT NULL,
    [next_event_id] INT NOT NULL,
    CONSTRAINT [PK_event_event] PRIMARY KEY CLUSTERED ([previous_event_id],[next_event_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_grant_resulted] (
    [event_id] INT NOT NULL,
    [grant_id] INT NOT NULL,
    CONSTRAINT [PK_event_grant_resulted] PRIMARY KEY CLUSTERED ([event_id],[grant_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_member_involved] (
    [event_id] INT NOT NULL,
    [member_id] INT NOT NULL,
    CONSTRAINT [PK_event_member_involved] PRIMARY KEY CLUSTERED ([event_id],[member_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_next_event] (
    [event_id] INT NOT NULL,
    [next_event_id] INT NOT NULL,
    CONSTRAINT [PK_event_next_event] PRIMARY KEY CLUSTERED ([event_id],[next_event_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_partner_involved] (
    [event_id] INT NOT NULL,
    [organization_id] INT NOT NULL,
    CONSTRAINT [PK_event_partner_involved] PRIMARY KEY CLUSTERED ([event_id],[organization_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_previous_event] (
    [event_id] INT NOT NULL,
    [previous_event_id] INT NOT NULL,
    CONSTRAINT [PK_event_previous_event] PRIMARY KEY CLUSTERED ([event_id],[previous_event_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_product_resulted] (
    [event_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_event_product_resulted] PRIMARY KEY CLUSTERED ([event_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_topic] (
    [topic_id] INT NOT NULL,
    [event_id] INT NOT NULL,
    CONSTRAINT [PK_event_topic] PRIMARY KEY CLUSTERED ([topic_id],[event_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_type] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(100) NOT NULL,
    [name_fr] NVARCHAR(100) NOT NULL,
    CONSTRAINT [PK_event_type] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[faculty] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255) NOT NULL,
    [name_fr] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_faculty] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[grant] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(2000) NOT NULL,
    [amount] MONEY NOT NULL,
    [throught_lri] BIT NOT NULL CONSTRAINT [DF_grant_throught_lri] DEFAULT 0,
    [status_id] INT,
    [submission_date] DATE,
    [obtained_date] DATE,
    [completed_date] DATE,
    [source_id] INT,
    [all_investigator] NVARCHAR(3000),
    [topic_id] INT,
    [note] NVARCHAR(3000),
    CONSTRAINT [PK_grant] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[grant_investigator_member] (
    [grant_id] INT NOT NULL,
    [member_id] INT NOT NULL,
    CONSTRAINT [PK_grant_investigator_member] PRIMARY KEY CLUSTERED ([grant_id],[member_id])
);

-- CreateTable
CREATE TABLE [dbo].[grant_member_involved] (
    [grant_id] INT NOT NULL,
    [member_id] INT NOT NULL,
    CONSTRAINT [PK_grant_member_involved] PRIMARY KEY CLUSTERED ([grant_id],[member_id])
);

-- CreateTable
CREATE TABLE [dbo].[has_keyword] (
    [member_id] INT NOT NULL,
    [keyword_id] INT NOT NULL,
    CONSTRAINT [PK_has_keyword] PRIMARY KEY CLUSTERED ([member_id],[keyword_id]),
    CONSTRAINT [UK_has_keyword] UNIQUE NONCLUSTERED ([member_id],[keyword_id])
);

-- CreateTable
CREATE TABLE [dbo].[insight] (
    [id] INT NOT NULL IDENTITY(1,1),
    [member_id] INT NOT NULL,
    [interview_date] DATE,
    [about_member] NVARCHAR(max),
    [about_promotions] NVARCHAR(max),
    [dream] NVARCHAR(max),
    [how_can_we_help] NVARCHAR(max),
    [admin_notes] NVARCHAR(max),
    [other_notes] NVARCHAR(max),
    CONSTRAINT [PK_insight] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UK_insight_member_id] UNIQUE NONCLUSTERED ([member_id])
);

-- CreateTable
CREATE TABLE [dbo].[keyword] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(200),
    [name_fr] NVARCHAR(200),
    CONSTRAINT [PK_keyword] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UK_keyword_names] UNIQUE NONCLUSTERED ([name_en],[name_fr])
);

-- CreateTable
CREATE TABLE [dbo].[legacy] (
    [ID] INT NOT NULL,
    [first_name] NVARCHAR(255),
    [last_name] NVARCHAR(255),
    [business_name] NVARCHAR(255),
    [date_joined] DATETIME,
    [interview_date] DATETIME,
    [date_in_active] DATETIME,
    [email] NVARCHAR(255),
    [address] NVARCHAR(255),
    [city] NVARCHAR(255),
    [province] NVARCHAR(255),
    [country] NVARCHAR(255),
    [postal_code] NVARCHAR(255),
    [business_phone] NVARCHAR(255),
    [mobile_phone] NVARCHAR(255),
    [interview_notes] NVARCHAR(max),
    [is_active] BIT NOT NULL,
    [category] INT,
    [keywords_EN] NVARCHAR(max),
    [keywords_FR] NVARCHAR(max),
    [problems_EN] NVARCHAR(max),
    [problems_FR] NVARCHAR(max),
    [dream] NVARCHAR(max),
    [notes] NVARCHAR(max),
    [how_can_we_help] NVARCHAR(max),
    [faculty] INT,
    [partnerships_1_notes] NVARCHAR(max),
    [partnerships_2_notes] NVARCHAR(max),
    [partnerships_3_notes] NVARCHAR(max),
    [partnerships_future_notes] NVARCHAR(max),
    [future_promotion_notes] NVARCHAR(max),
    [indicators_frequency] INT,
    [other_comments] NVARCHAR(max),
    [interviewer_notes] NVARCHAR(max)
);

-- CreateTable
CREATE TABLE [dbo].[level] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_fr] NVARCHAR(50) NOT NULL,
    [name_en] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_level] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[member] (
    [id] INT NOT NULL IDENTITY(1,1),
    [account_id] INT NOT NULL,
    [faculty_id] INT,
    [type_id] INT,
    [work_email] NVARCHAR(255),
    [work_phone] NVARCHAR(50),
    [about_me_fr] NVARCHAR(max),
    [about_me_en] NVARCHAR(max),
    [website_link] NVARCHAR(4000),
    [twitter_link] NVARCHAR(4000),
    [facebook_link] NVARCHAR(4000),
    [linkedin_link] NVARCHAR(4000),
    [tiktok_link] NVARCHAR(4000),
    [cv_link] NVARCHAR(4000),
    [address] NVARCHAR(255),
    [city] NVARCHAR(255),
    [province] NVARCHAR(255),
    [country] NVARCHAR(255),
    [postal_code] NVARCHAR(255),
    [mobile_phone] NVARCHAR(50),
    [date_joined] DATE,
    [is_active] BIT NOT NULL CONSTRAINT [DF_member_is_active] DEFAULT 1,
    [last_active] DATE,
    CONSTRAINT [PK_member] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UK_account_id] UNIQUE NONCLUSTERED ([account_id])
);

-- CreateTable
CREATE TABLE [dbo].[member_type] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255) NOT NULL,
    [name_fr] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_member_type] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[org_scope] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255) NOT NULL,
    [name_fr] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_org_scope] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[org_type] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255) NOT NULL,
    [name_fr] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_org_type] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[organization] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255) NOT NULL,
    [name_fr] NVARCHAR(255) NOT NULL,
    [scope_id] INT,
    [type_id] INT,
    [description] NVARCHAR(4000),
    CONSTRAINT [PK_organization] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[partnership_member_org] (
    [member_id] INT NOT NULL,
    [organization_id] INT NOT NULL,
    [description] NVARCHAR(max),
    CONSTRAINT [PK_current_partnership] PRIMARY KEY CLUSTERED ([member_id],[organization_id])
);

-- CreateTable
CREATE TABLE [dbo].[problem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [member_id] INT NOT NULL,
    [name_en] NVARCHAR(4000),
    [name_fr] NVARCHAR(4000),
    CONSTRAINT [PK_problem] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[product] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title_en] NVARCHAR(500) NOT NULL,
    [title_fr] NVARCHAR(500) NOT NULL,
    [publish_date] DATE,
    [all_author] NVARCHAR(3000),
    [doi] NVARCHAR(100),
    [on_going] BIT NOT NULL CONSTRAINT [DF_product_on_going] DEFAULT 0,
    [peer_reviewed] BIT NOT NULL CONSTRAINT [DF_product_peer_reviewed] DEFAULT 0,
    [product_type_id] INT,
    [note] NVARCHAR(2000),
    CONSTRAINT [PK_product] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[product_member_all_author] (
    [member_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_product_member_all_author] PRIMARY KEY CLUSTERED ([member_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[product_member_author] (
    [member_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_product_member_author] PRIMARY KEY CLUSTERED ([member_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[product_partnership] (
    [organization_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_product_partnership] PRIMARY KEY CLUSTERED ([organization_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[product_target] (
    [target_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_product_target] PRIMARY KEY CLUSTERED ([target_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[product_topic] (
    [topic_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    CONSTRAINT [PK_product_topic] PRIMARY KEY CLUSTERED ([topic_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[product_type] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(200) NOT NULL,
    [name_fr] NVARCHAR(200) NOT NULL,
    CONSTRAINT [PK_product_type] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[promotion_strategy] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(255),
    [name_fr] NVARCHAR(255),
    CONSTRAINT [PK_promotion_strategy] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[source] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(50) NOT NULL,
    [name_fr] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_source] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[status] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_en] NVARCHAR(50) NOT NULL,
    [name_fr] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_status] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[supervision] (
    [id] INT NOT NULL IDENTITY(1,1),
    [last_name] NVARCHAR(100) NOT NULL,
    [first_name] NVARCHAR(100) NOT NULL,
    [start_date] DATE,
    [end_date] DATE,
    [faculty_id] INT,
    [level_id] INT,
    [note] NVARCHAR(max),
    CONSTRAINT [PK_supervision] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[supervision_co_supervisor] (
    [member_id] INT NOT NULL,
    [supervision_id] INT NOT NULL,
    CONSTRAINT [PK_supervision_co_supervisor] PRIMARY KEY CLUSTERED ([member_id],[supervision_id])
);

-- CreateTable
CREATE TABLE [dbo].[supervision_committee] (
    [member_id] INT NOT NULL,
    [supervision_id] INT NOT NULL,
    CONSTRAINT [PK_supervision_committee] PRIMARY KEY CLUSTERED ([member_id],[supervision_id])
);

-- CreateTable
CREATE TABLE [dbo].[supervision_principal_supervisor] (
    [member_id] INT NOT NULL,
    [supervision_id] INT NOT NULL,
    CONSTRAINT [PK_supervision_principal_supervisor] PRIMARY KEY CLUSTERED ([member_id],[supervision_id])
);

-- CreateTable
CREATE TABLE [dbo].[supervision_trainee] (
    [member_id] INT NOT NULL,
    [supervision_id] INT NOT NULL,
    CONSTRAINT [PK_supervision_trainee] PRIMARY KEY CLUSTERED ([member_id],[supervision_id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B6138BE0713] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[target] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_fr] NVARCHAR(300) NOT NULL,
    [name_en] NVARCHAR(300) NOT NULL,
    CONSTRAINT [PK_target_stakeholder] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[topic] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name_fr] NVARCHAR(300) NOT NULL,
    [name_en] NVARCHAR(300) NOT NULL,
    CONSTRAINT [PK_topic] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[current_promotion_strategy] ADD CONSTRAINT [FK_current_promotion_strategy_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[current_promotion_strategy] ADD CONSTRAINT [FK_current_promotion_strategy_promotion_strategy_id] FOREIGN KEY ([promotion_strategy_id]) REFERENCES [dbo].[promotion_strategy]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[desired_partnership] ADD CONSTRAINT [FK_desired_partnership_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[desired_partnership] ADD CONSTRAINT [FK_desired_partnership_scope_id] FOREIGN KEY ([scope_id]) REFERENCES [dbo].[org_scope]([id]) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE [dbo].[desired_partnership] ADD CONSTRAINT [FK_desired_partnership_type_id] FOREIGN KEY ([type_id]) REFERENCES [dbo].[org_type]([id]) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE [dbo].[desired_promotion_strategy] ADD CONSTRAINT [FK_desired_promotion_strategy_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[desired_promotion_strategy] ADD CONSTRAINT [FK_desired_promotion_strategy_promotion_strategy_id] FOREIGN KEY ([promotion_strategy_id]) REFERENCES [dbo].[promotion_strategy]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [FK_event_topic] FOREIGN KEY ([topic_id]) REFERENCES [dbo].[topic]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [FK_event_type] FOREIGN KEY ([event_type_id]) REFERENCES [dbo].[event_type]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_grant_resulted] ADD CONSTRAINT [FK_event_grant_resulted_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_grant_resulted] ADD CONSTRAINT [FK_event_grant_resulted_grant] FOREIGN KEY ([grant_id]) REFERENCES [dbo].[grant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_member_involved] ADD CONSTRAINT [FK_event_member_involved_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_member_involved] ADD CONSTRAINT [FK_event_member_involved_member] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_next_event] ADD CONSTRAINT [FK_event_next_event_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_next_event] ADD CONSTRAINT [FK_event_next_event_next_event_id] FOREIGN KEY ([next_event_id]) REFERENCES [dbo].[event]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_partner_involved] ADD CONSTRAINT [FK_event_partner_involved_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_partner_involved] ADD CONSTRAINT [FK_event_partner_involved_org] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_previous_event] ADD CONSTRAINT [FK_event_previous_event_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_previous_event] ADD CONSTRAINT [FK_event_previous_event_previous_event_id] FOREIGN KEY ([previous_event_id]) REFERENCES [dbo].[event]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_product_resulted] ADD CONSTRAINT [FK_event_product_resulted_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_product_resulted] ADD CONSTRAINT [FK_event_product_resulted_product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_topic] ADD CONSTRAINT [FK_event_topic_event_id] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_topic] ADD CONSTRAINT [FK_event_topic_topic_id] FOREIGN KEY ([topic_id]) REFERENCES [dbo].[topic]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[grant] ADD CONSTRAINT [FK_grant_source] FOREIGN KEY ([source_id]) REFERENCES [dbo].[source]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant] ADD CONSTRAINT [FK_grant_status] FOREIGN KEY ([status_id]) REFERENCES [dbo].[status]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant] ADD CONSTRAINT [FK_grant_topic] FOREIGN KEY ([topic_id]) REFERENCES [dbo].[topic]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant_investigator_member] ADD CONSTRAINT [FK_grant_investigator_member_grant] FOREIGN KEY ([grant_id]) REFERENCES [dbo].[grant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant_investigator_member] ADD CONSTRAINT [FK_grant_investigator_member_member] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant_member_involved] ADD CONSTRAINT [FK_grant_member_involved_grant] FOREIGN KEY ([grant_id]) REFERENCES [dbo].[grant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[grant_member_involved] ADD CONSTRAINT [FK_grant_member_involved_member] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[has_keyword] ADD CONSTRAINT [FK_has_keyword_keyword_id] FOREIGN KEY ([keyword_id]) REFERENCES [dbo].[keyword]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[has_keyword] ADD CONSTRAINT [FK_has_keyword_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[insight] ADD CONSTRAINT [FK_insight_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[member] ADD CONSTRAINT [FK_member_account_id] FOREIGN KEY ([account_id]) REFERENCES [dbo].[account]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[member] ADD CONSTRAINT [FK_member_faculty_id] FOREIGN KEY ([faculty_id]) REFERENCES [dbo].[faculty]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[member] ADD CONSTRAINT [FK_member_type_id] FOREIGN KEY ([type_id]) REFERENCES [dbo].[member_type]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[organization] ADD CONSTRAINT [FK_organization_scope_id] FOREIGN KEY ([scope_id]) REFERENCES [dbo].[org_scope]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[organization] ADD CONSTRAINT [FK_organization_type_id] FOREIGN KEY ([type_id]) REFERENCES [dbo].[org_type]([id]) ON DELETE SET NULL ON UPDATE SET NULL;

-- AddForeignKey
ALTER TABLE [dbo].[partnership_member_org] ADD CONSTRAINT [FK_current_partnership_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[partnership_member_org] ADD CONSTRAINT [FK_current_partnership_organization_id] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[problem] ADD CONSTRAINT [FK_problem_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product] ADD CONSTRAINT [FK_product_product_type] FOREIGN KEY ([product_type_id]) REFERENCES [dbo].[product_type]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_member_author] ADD CONSTRAINT [FK_product_member_author_member] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_member_author] ADD CONSTRAINT [FK_product_member_author_product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_partnership] ADD CONSTRAINT [FK_product_partnership_ong] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_partnership] ADD CONSTRAINT [FK_product_partnership_product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_target] ADD CONSTRAINT [FK_product_target_product] FOREIGN KEY ([product_id]) REFERENCES [dbo].[product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_target] ADD CONSTRAINT [FK_product_target_target_id] FOREIGN KEY ([target_id]) REFERENCES [dbo].[target]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_topic] ADD CONSTRAINT [FK_product_topic_product_id] FOREIGN KEY ([product_id]) REFERENCES [dbo].[product]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[product_topic] ADD CONSTRAINT [FK_product_topic_topic_id] FOREIGN KEY ([topic_id]) REFERENCES [dbo].[topic]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[supervision] ADD CONSTRAINT [FK_supervision_faculty] FOREIGN KEY ([faculty_id]) REFERENCES [dbo].[faculty]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[supervision] ADD CONSTRAINT [FK_supervision_level] FOREIGN KEY ([level_id]) REFERENCES [dbo].[level]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_co_supervisor] ADD CONSTRAINT [FK_supervision_co_supervisor_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_co_supervisor] ADD CONSTRAINT [FK_supervision_co_supervisor_supervision_id] FOREIGN KEY ([supervision_id]) REFERENCES [dbo].[supervision]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_committee] ADD CONSTRAINT [FK_supervision_committee_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_committee] ADD CONSTRAINT [FK_supervision_committee_supervision_id] FOREIGN KEY ([supervision_id]) REFERENCES [dbo].[supervision]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_principal_supervisor] ADD CONSTRAINT [FK_supervision_principal_supervisor_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_principal_supervisor] ADD CONSTRAINT [FK_supervision_principal_supervisor_supervision_id] FOREIGN KEY ([supervision_id]) REFERENCES [dbo].[supervision]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_trainee] ADD CONSTRAINT [FK_supervision_trainee_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision_trainee] ADD CONSTRAINT [FK_supervision_trainee_supervision_id] FOREIGN KEY ([supervision_id]) REFERENCES [dbo].[supervision]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
