-- Dados no schema anterior para provar que a migração preserva/transforma corretamente.
INSERT INTO "User"(id,email,name,updatedAt,createdAt) VALUES
  ('u1','Owner@Agency.test','Owner',0,0),
  ('u2','dup@x.test','Dup lower',0,0),
  ('u3','DUP@x.test','Dup upper',0,0);
INSERT INTO "Organization"(id,name,slug,plan,trialUsedAt,trialEndsAt,createdAt,updatedAt) VALUES ('o1','Org','org','free',1000,2000,0,0);
INSERT INTO "Membership"(id,userId,organizationId,role,createdAt,updatedAt) VALUES ('m1','u1','o1','owner',123,0);
INSERT INTO "Client"(id,organizationId,slug,name,createdAt,updatedAt) VALUES ('c1','o1','cli','Cli',0,0);
INSERT INTO "CalendarVersion"(id,clientId,version,createdAt,updatedAt) VALUES ('v1','c1','v1',0,0);
INSERT INTO "ShareToken"(id,token,calendarVersionId,createdAt) VALUES ('t1','agencytok','v1',0),('t2','invitetok','v1',0);
INSERT INTO "ClientReviewer"(id,organizationId,email,name,createdAt,updatedAt) VALUES ('r1','o1','r@x.test','R',0,0);
INSERT INTO "ClientInvite"(id,reviewerId,calendarVersionId,shareTokenId,role,status,createdAt,updatedAt) VALUES ('i1','r1','v1','t2','viewer','active',0,0);
INSERT INTO "PasswordResetToken"(id,token,userId,expiresAt,createdAt) VALUES ('p1','plain','u1',0,0);
