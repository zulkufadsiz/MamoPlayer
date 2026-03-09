import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Fast Integration',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <React.Fragment>
        Start with the core player quickly using the setup guides and drop-in examples in the
        documentation.
      </React.Fragment>
    ),
  },
  {
    title: 'Production Features',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <React.Fragment>
        Explore analytics events, ads and monetization, theming, and pro capabilities for OTT
        experiences.
      </React.Fragment>
    ),
  },
  {
    title: 'React Native Ready',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <React.Fragment>
        Built for React Native apps with practical guidance for implementation, customization, and
        troubleshooting.
      </React.Fragment>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
