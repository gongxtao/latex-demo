/**
 * Editor content fixtures for testing
 * Provides pre-configured HTML content for various editor test scenarios
 */

/**
 * Simple plain text content fixture
 */
export const simple = {
  html: '<p>Simple paragraph with plain text content.</p>',
  text: 'Simple paragraph with plain text content.',
  description: 'Simple plain text paragraph',
};

/**
 * Content with embedded image fixture
 */
export const withImage = {
  html: `
    <h2>Document with Image</h2>
    <p>This is a paragraph before the image.</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Test Image" style="width: 100px; height: 100px;" />
    <p>This is a paragraph after the image.</p>
  `,
  text: 'Document with Image\nThis is a paragraph before the image.\nThis is a paragraph after the image.',
  description: 'Content with embedded image',
  imageCount: 1,
};

/**
 * Content with table fixture
 */
export const withTable = {
  html: `
    <h2>Document with Table</h2>
    <p>Introduction paragraph.</p>
    <table border="1">
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
          <th>Header 3</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
          <td>Cell 3</td>
        </tr>
        <tr>
          <td>Cell 4</td>
          <td>Cell 5</td>
          <td>Cell 6</td>
        </tr>
      </tbody>
    </table>
    <p>Conclusion paragraph.</p>
  `,
  text: 'Document with Table\nIntroduction paragraph.\nHeader 1\tHeader 2\tHeader 3\nCell 1\tCell 2\tCell 3\nCell 4\tCell 5\tCell 6\nConclusion paragraph.',
  description: 'Content with table',
  tableCount: 1,
  rowCount: 3,
  colCount: 3,
};

/**
 * Content with text formatting fixture
 */
export const withFormatting = {
  html: `
    <h1>Main Heading</h1>
    <h2>Subheading</h2>
    <p>This paragraph has <strong>bold text</strong>, <em>italic text</em>, and <u>underlined text</u>.</p>
    <p>This has <s>strikethrough</s> and <code>inline code</code>.</p>
    <blockquote>This is a blockquote with important information.</blockquote>
    <ul>
      <li>First bullet point</li>
      <li>Second bullet point</li>
      <li>Third bullet point</li>
    </ul>
    <ol>
      <li>First numbered item</li>
      <li>Second numbered item</li>
      <li>Third numbered item</li>
    </ol>
  `,
  text: 'Main Heading\nSubheading\nThis paragraph has bold text, italic text, and underlined text.\nThis has strikethrough and inline code.\nThis is a blockquote with important information.\n\n• First bullet point\n• Second bullet point\n• Third bullet point\n\n1. First numbered item\n2. Second numbered item\n3. Third numbered item',
  description: 'Content with various text formatting',
  hasHeadings: true,
  hasLists: true,
};

/**
 * Complete resume document fixture
 */
export const fullResume = {
  html: `
    <h1 style="text-align: center;">John Doe</h1>
    <p style="text-align: center;">
      <strong>Software Engineer</strong> | john.doe@email.com | (555) 123-4567
    </p>
    <hr />
    <h2>Professional Summary</h2>
    <p>
      Experienced software engineer with expertise in full-stack development,
      specializing in React, Node.js, and cloud technologies. Proven track record
      of delivering high-quality solutions for enterprise clients.
    </p>
    <h2>Work Experience</h2>
    <h3>Senior Software Engineer</h3>
    <p><strong>Tech Company Inc.</strong> | January 2020 - Present</p>
    <ul>
      <li>Led development of microservices architecture serving 1M+ users</li>
      <li>Reduced application load time by 40% through optimization</li>
      <li>Mentored team of 5 junior developers</li>
    </ul>
    <h3>Software Developer</h3>
    <p><strong>StartUp Corp</strong> | June 2017 - December 2019</p>
    <ul>
      <li>Developed RESTful APIs using Node.js and Express</li>
      <li>Implemented CI/CD pipelines reducing deployment time by 60%</li>
      <li>Collaborated with UX team to improve user experience</li>
    </ul>
    <h2>Education</h2>
    <h3>Bachelor of Science in Computer Science</h3>
    <p><strong>University of Technology</strong> | Graduated May 2017</p>
    <ul>
      <li>GPA: 3.8/4.0</li>
      <li>Dean's List: All semesters</li>
    </ul>
    <h2>Skills</h2>
    <table border="1">
      <tbody>
        <tr>
          <td><strong>Programming Languages</strong></td>
          <td>JavaScript, TypeScript, Python, Java</td>
        </tr>
        <tr>
          <td><strong>Frameworks</strong></td>
          <td>React, Node.js, Express, Next.js</td>
        </tr>
        <tr>
          <td><strong>Tools</strong></td>
          <td>Git, Docker, AWS, Jenkins</td>
        </tr>
      </tbody>
    </table>
    <h2>Certifications</h2>
    <ul>
      <li>AWS Certified Solutions Architect - 2022</li>
      <li>Google Cloud Professional Developer - 2021</li>
    </ul>
  `,
  text: `John Doe
Software Engineer | john.doe@email.com | (555) 123-4567

Professional Summary
Experienced software engineer with expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering high-quality solutions for enterprise clients.

Work Experience
Senior Software Engineer
Tech Company Inc. | January 2020 - Present
• Led development of microservices architecture serving 1M+ users
• Reduced application load time by 40% through optimization
• Mentored team of 5 junior developers

Software Developer
StartUp Corp | June 2017 - December 2019
• Developed RESTful APIs using Node.js and Express
• Implemented CI/CD pipelines reducing deployment time by 60%
• Collaborated with UX team to improve user experience

Education
Bachelor of Science in Computer Science
University of Technology | Graduated May 2017
• GPA: 3.8/4.0
• Dean's List: All semesters

Skills
Programming Languages\tJavaScript, TypeScript, Python, Java
Frameworks\tReact, Node.js, Express, Next.js
Tools\tGit, Docker, AWS, Jenkins

Certifications
• AWS Certified Solutions Architect - 2022
• Google Cloud Professional Developer - 2021`,
  description: 'Complete resume document',
  sectionCount: 6,
  hasContactInfo: true,
};

/**
 * Empty content fixture
 */
export const empty = {
  html: '<p><br></p>',
  text: '',
  description: 'Empty content',
};

/**
 * Content with multiple images fixture
 */
export const withMultipleImages = {
  html: `
    <h2>Image Gallery</h2>
    <p>First image:</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Image 1" style="width: 100px; height: 100px;" />
    <p>Second image:</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Image 2" style="width: 100px; height: 100px;" />
    <p>Third image:</p>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Image 3" style="width: 100px; height: 100px;" />
  `,
  text: 'Image Gallery\nFirst image:\nSecond image:\nThird image:',
  description: 'Content with multiple images',
  imageCount: 3,
};

/**
 * Content with mixed inline formatting fixture
 */
export const withInlineFormatting = {
  html: `
    <p>
      This paragraph has <strong>bold</strong>, <em>italic</em>, <u>underlined</u>,
      <s>strikethrough</s>, <code>code</code>, and
      <span style="color: red;">colored</span> text.
    </p>
    <p>
      It also has <a href="https://example.com">links</a> and
      <sup>superscript</sup> and <sub>subscript</sub> text.
    </p>
  `,
  text: 'This paragraph has bold, italic, underlined, strikethrough, code, and colored text.\nIt also has links and superscript and subscript text.',
  description: 'Content with mixed inline formatting',
  hasLinks: true,
};

/**
 * Content with nested lists fixture
 */
export const withNestedLists = {
  html: `
    <h2>Nested Lists Example</h2>
    <ul>
      <li>Level 1 item 1</li>
      <li>
        Level 1 item 2
        <ul>
          <li>Level 2 item 1</li>
          <li>
            Level 2 item 2
            <ul>
              <li>Level 3 item 1</li>
              <li>Level 3 item 2</li>
            </ul>
          </li>
          <li>Level 2 item 3</li>
        </ul>
      </li>
      <li>Level 1 item 3</li>
    </ul>
  `,
  text: 'Nested Lists Example\n• Level 1 item 1\n• Level 1 item 2\n  • Level 2 item 1\n  • Level 2 item 2\n    • Level 3 item 1\n    • Level 3 item 2\n  • Level 2 item 3\n• Level 1 item 3',
  description: 'Content with nested lists',
  maxNestingLevel: 3,
};

/**
 * Content with code block fixture
 */
export const withCodeBlock = {
  html: `
    <h2>Code Example</h2>
    <p>Here's a JavaScript function:</p>
    <pre><code>function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));</code></pre>
    <p>The function above demonstrates template literals.</p>
  `,
  text: 'Code Example\nHere\'s a JavaScript function:\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet(\'World\'));\n\nThe function above demonstrates template literals.',
  description: 'Content with code block',
  language: 'javascript',
};

/**
 * All content fixtures indexed by name for easy access
 */
export const contentFixtures = {
  simple,
  withImage,
  withTable,
  withFormatting,
  fullResume,
  empty,
  withMultipleImages,
  withInlineFormatting,
  withNestedLists,
  withCodeBlock,
};

/**
 * Type definition for content fixture
 */
export interface ContentFixture {
  html: string;
  text: string;
  description: string;
  [key: string]: string | number | boolean;
}

/**
 * Gets a content fixture by name
 *
 * @param name - Name of the fixture
 * @returns Content fixture or undefined if not found
 */
export function getContentFixture(name: keyof typeof contentFixtures): ContentFixture {
  return contentFixtures[name];
}

/**
 * Gets all content fixture names
 *
 * @returns Array of fixture names
 */
export function getFixtureNames(): Array<keyof typeof contentFixtures> {
  return Object.keys(contentFixtures) as Array<keyof typeof contentFixtures>;
}
