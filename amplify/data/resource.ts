import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Profile: a.model({
    alias: a.string().required(),
    interests: a.string().array(),
    realHandle: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  Session: a.model({
    title: a.string().required(),
    tag: a.string().required(),
    location: a.string().required(),
    startsAt: a.string().required(),
    maxSpots: a.integer().required(),
    hostAlias: a.string().required(),
    participants: a.hasMany('Participant', 'sessionId'),
    messages: a.hasMany('Message', 'sessionId'),
  }).authorization((allow) => [allow.authenticated()]),

  Participant: a.model({
    sessionId: a.id().required(),
    session: a.belongsTo('Session', 'sessionId'),
    alias: a.string().required(),
    revealedHandle: a.string(),
  }).authorization((allow) => [allow.authenticated()]),

  Message: a.model({
    sessionId: a.id().required(),
    session: a.belongsTo('Session', 'sessionId'),
    senderAlias: a.string().required(),
    body: a.string().required(),
  }).authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
