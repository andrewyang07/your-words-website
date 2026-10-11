const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subjects are often Chinese or contain product names; don't enforce casing.
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};

export default config;
