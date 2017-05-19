module.exports = function (w) {

  return {
    files: [
      'src/*.ts'
    ],

    tests: [
      'test/*Spec.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'mocha'
  };
};