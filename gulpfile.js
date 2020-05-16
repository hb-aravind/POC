const { series, src, dest } = require('gulp');
const rimraf = require('rimraf');
const jsonEditor = require('gulp-json-editor');
const apidoc = require('gulp-apidoc');
const { argv } = require('yargs');

const scripts = {
  start: 'pm2 start ecosystem.config.js --env production',
  stop: 'pm2 stop all',
  delete: 'pm2 delete all',
  reload: 'pm2 reload ecosystem.config.js',
};

const paths = {
  dist: 'dist',
  root: 'app',
  docs: './docs/',
  protractor: [],
};

function cleanDist(cb) {
  return rimraf(paths.dist, cb);
}

function copyFiles() {
  return src(['ecosystem.config.js', 'pm2-startup.sh', 'pm2-script.sh']).pipe(dest(paths.dist));
}

function copyPackage() {
  return src('package.json')
    .pipe(
      jsonEditor(json => {
        json.scripts = scripts;
        delete json.devDependencies;
        return json;
      }),
    )
    .pipe(dest(paths.dist));
}

function copySeed() {
  return src(`./${paths.root}/seed/data/**/*.json`).pipe(
    dest(`${paths.dist}/${paths.root}/seed/data/`),
  );
}

function copyViews() {
  return src(`./${paths.root}/views/**/*`).pipe(dest(`${paths.dist}/${paths.root}/views`));
}

function copyPublic() {
  return src(`./${paths.root}/public/**/*`).pipe(dest(`${paths.dist}/${paths.root}/public`));
}

function apiDoc(done) {
  const { type } = argv;

  if (['admin', 'mobile', 'web'].indexOf(type) !== -1) {
    return apidoc(
      {
        src: `${paths.root}/${type}`,
        dest: `${paths.docs}/${type}`,
        config: `${paths.root}/${type}`,
      },
      done,
    );
  }
  // eslint-disable-next-line no-console
  console.log('Provide valid type to generate API doc');
  return done();
}

exports.default = series(cleanDist, copyFiles, copyPackage, copyPublic, copyViews, copySeed);
exports.apidoc = apiDoc;
