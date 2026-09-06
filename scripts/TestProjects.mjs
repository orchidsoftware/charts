import { playwright } from "@vitest/browser-playwright";

const inputFiles = [
  "test/Compatibility.test.js",
  "test/BubbleBounds.test.js",
  "test/RadarInspection.test.js",
];
const siteFiles = [
  "test/Demo*.test.js",
  "test/Lab.test.js",
  "test/Documentation.test.js",
];
const visualFiles = [
  "test/VisualRegression.test.js",
];
const performanceFiles = [
  "test/Performance.test.js",
];

function browserProject(
  name,
  include,
  groupOrder,
  browsers = [
    "chromium",
  ],
) {
  return {
    extends: true,
    test: {
      name,
      include,
      sequence: { groupOrder },
      fileParallelism: name === "browser",
      setupFiles: [
        "./test/support/Cleanup.js",
      ],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        commands: {
          resizeBrowser: ({ page }, size) => page.setViewportSize(size),
          emulateAppearance: ({ page }, colorScheme) => page.emulateMedia({ colorScheme }),
        },
        instances: browsers.map((browser) => ({
          browser,
          name: `${name}-${browser}`,
        })),
        expect: {
          toMatchScreenshot: {
            comparatorName: "pixelmatch",
            comparatorOptions: { allowedMismatchedPixelRatio: 0.0005, threshold: 0.1 },
          },
        },
      },
    },
  };
}

export function testProjects(isCompatibility) {
  if (isCompatibility) {
    return [
      browserProject("compatibility", inputFiles, 0, [
        "chromium",
        "firefox",
        "webkit",
      ]),
    ];
  }
  const browser = browserProject(
    "browser",
    [
      "test/**/*.test.js",
    ],
    0,
  );
  browser.test.exclude = [
    "test/policies/**",
    ...inputFiles,
    ...siteFiles,
    ...visualFiles,
    ...performanceFiles,
  ];
  return [
    {
      extends: true,
      test: {
        name: "node",
        environment: "node",
        include: [
          "test/policies/**/*.test.js",
        ],
        sequence: { groupOrder: 0 },
      },
    },
    browser,
    browserProject("site", siteFiles, 1),
    browserProject("visual", visualFiles, 2),
    browserProject("input", inputFiles, 3),
    browserProject("performance", performanceFiles, 4),
  ];
}
