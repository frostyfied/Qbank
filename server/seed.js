require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Question = require('./models/Question');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // 1. Find an existing user to be the author
    const author = await User.findOne();
    if (!author) {
      console.error('❌ NO USERS FOUND! Please register an account on the frontend first, then run this seed script.');
      process.exit(1);
    }
    console.log(`✅ Found author: ${author.name} (${author.email})`);

    // 2. Setup Subjects
    const subjectData = [
      { name: 'Data Structures and Algorithms', code: 'CS201', semester: 3, topics: ['Arrays', 'Trees', 'Graphs'] },
      { name: 'Database Management Systems', code: 'CS301', semester: 5, topics: ['SQL', 'Normalization', 'Transactions'] },
      { name: 'Operating Systems', code: 'CS302', semester: 5, topics: ['Processes', 'Memory', 'Deadlocks'] },
      { name: 'Computer Networks', code: 'CS401', semester: 7, topics: ['TCP/IP', 'Routing', 'Security'] },
    ];

    const subjects = {};
    for (const s of subjectData) {
      let subj = await Subject.findOne({ code: s.code });
      if (!subj) {
        subj = await Subject.create(s);
        console.log(`✅ Created Subject: ${s.name}`);
      }
      subjects[s.code] = subj;
    }

    // 3. Define 20 Questions (5 per subject)
    const questionsToSeed = [
      // --- DSA (CS201) ---
      { subject: 'CS201', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], correctAnswer: 'O(log n)', difficulty: 'easy', marks: 2, topic: 'Searching', explanation: 'Binary search halves the search space each time, resulting in logarithmic time complexity.' },
      { subject: 'CS201', text: 'Which data structure uses LIFO (Last In, First Out) order?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctAnswer: 'Stack', difficulty: 'easy', marks: 1, topic: 'Stacks', explanation: 'A stack pushes and pops from the same end, hence Last In, First Out.' },
      { subject: 'CS201', text: 'In a max-heap, the largest element is always at the:', options: ['Leftmost leaf', 'Rightmost leaf', 'Root', 'Middle'], correctAnswer: 'Root', difficulty: 'medium', marks: 2, topic: 'Heaps', explanation: 'A max-heap property ensures every parent is greater than or equal to its children, making the root the maximum.' },
      { subject: 'CS201', text: 'What is the worst-case time complexity of QuickSort?', options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'], correctAnswer: 'O(n^2)', difficulty: 'hard', marks: 3, topic: 'Sorting', explanation: 'Quicksort degrades to O(n^2) when the pivot chosen is always the smallest or largest element.' },
      { subject: 'CS201', text: 'Which traversal of a Binary Search Tree visits nodes in ascending order?', options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'], correctAnswer: 'In-order', difficulty: 'medium', marks: 2, topic: 'Trees', explanation: 'In-order traversal visits Left, Root, Right, which naturally sorts the elements in a BST.' },

      // --- DBMS (CS301) ---
      { subject: 'CS301', text: 'What does ACID stand for in database transactions?', options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Consistency, Integrity, Durability', 'Atomicity, Concurrency, Isolation, Dependency', 'Action, Consistency, Integrity, Data'], correctAnswer: 'Atomicity, Consistency, Isolation, Durability', difficulty: 'medium', marks: 2, topic: 'Transactions', explanation: 'ACID is a set of properties that guarantee database transactions are processed reliably.' },
      { subject: 'CS301', text: 'Which SQL command is used to remove all rows from a table without logging individual row deletions?', options: ['DELETE', 'DROP', 'TRUNCATE', 'REMOVE'], correctAnswer: 'TRUNCATE', difficulty: 'medium', marks: 2, topic: 'SQL', explanation: 'TRUNCATE is a DDL command that quickly empties a table and cannot be rolled back in most databases.' },
      { subject: 'CS301', text: 'Which normal form eliminates transitive dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: '3NF', difficulty: 'hard', marks: 3, topic: 'Normalization', explanation: 'Third Normal Form (3NF) requires that no non-prime attribute is transitively dependent on the primary key.' },
      { subject: 'CS301', text: 'A primary key can contain NULL values.', options: ['True', 'False'], correctAnswer: 'False', difficulty: 'easy', marks: 1, topic: 'Keys', explanation: 'A primary key must uniquely identify a row and cannot contain NULL values.' },
      { subject: 'CS301', text: 'Which join returns all rows from the left table, and the matched rows from the right table?', options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL JOIN'], correctAnswer: 'LEFT JOIN', difficulty: 'medium', marks: 2, topic: 'SQL', explanation: 'A LEFT JOIN keeps all records from the left table regardless of matches in the right table.' },

      // --- OS (CS302) ---
      { subject: 'CS302', text: 'What is thrashing in an operating system?', options: ['High CPU utilization', 'Excessive paging causing low CPU utilization', 'A deadlock condition', 'A process terminating unexpectedly'], correctAnswer: 'Excessive paging causing low CPU utilization', difficulty: 'hard', marks: 3, topic: 'Memory', explanation: 'Thrashing occurs when the system spends more time paging than executing processes.' },
      { subject: 'CS302', text: 'Which scheduling algorithm can cause starvation?', options: ['Round Robin', 'First-Come First-Serve', 'Shortest Job First', 'FIFO'], correctAnswer: 'Shortest Job First', difficulty: 'medium', marks: 2, topic: 'Processes', explanation: 'SJF can starve longer jobs if shorter jobs keep arriving continuously.' },
      { subject: 'CS302', text: 'A process is a program in execution.', options: ['True', 'False'], correctAnswer: 'True', difficulty: 'easy', marks: 1, topic: 'Processes', explanation: 'A program is passive; a process is an active entity with a program counter and resources.' },
      { subject: 'CS302', text: 'What is a deadlock?', options: ['A process waiting for I/O', 'Two processes waiting for each other indefinitely', 'A memory leak', 'A crashed system'], correctAnswer: 'Two processes waiting for each other indefinitely', difficulty: 'easy', marks: 2, topic: 'Deadlocks', explanation: 'Deadlock happens when a set of processes are blocked because each holds a resource and waits for another.' },
      { subject: 'CS302', text: 'Which of the following is NOT a necessary condition for deadlock?', options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait'], correctAnswer: 'Preemption', difficulty: 'hard', marks: 3, topic: 'Deadlocks', explanation: 'No Preemption is a condition for deadlock. Preemption itself prevents deadlocks.' },

      // --- CN (CS401) ---
      { subject: 'CS401', text: 'Which layer of the OSI model is responsible for routing?', options: ['Data Link', 'Network', 'Transport', 'Session'], correctAnswer: 'Network', difficulty: 'medium', marks: 2, topic: 'OSI Model', explanation: 'The Network Layer (Layer 3) handles logical addressing and routing.' },
      { subject: 'CS401', text: 'What does TCP stand for?', options: ['Transmission Control Protocol', 'Transfer Control Protocol', 'Transport Communication Protocol', 'Terminal Control Protocol'], correctAnswer: 'Transmission Control Protocol', difficulty: 'easy', marks: 1, topic: 'TCP/IP', explanation: 'TCP is a connection-oriented protocol that ensures reliable data delivery.' },
      { subject: 'CS401', text: 'Which protocol is used to map IP addresses to MAC addresses?', options: ['DNS', 'DHCP', 'ARP', 'RARP'], correctAnswer: 'ARP', difficulty: 'medium', marks: 2, topic: 'Routing', explanation: 'Address Resolution Protocol (ARP) translates IP addresses to physical MAC addresses.' },
      { subject: 'CS401', text: 'IPv6 addresses are how many bits long?', options: ['32 bits', '64 bits', '128 bits', '256 bits'], correctAnswer: '128 bits', difficulty: 'easy', marks: 2, topic: 'TCP/IP', explanation: 'IPv6 uses 128-bit addresses, vastly expanding the available IP space compared to IPv4 (32-bit).' },
      { subject: 'CS401', text: 'Which port does HTTPS use by default?', options: ['80', '21', '443', '22'], correctAnswer: '443', difficulty: 'easy', marks: 1, topic: 'Security', explanation: 'HTTP uses port 80, while HTTPS (HTTP Secure) uses port 443 by default.' },
    ];

    // 4. Insert Questions
    let addedCount = 0;
    for (const q of questionsToSeed) {
      const subjObj = subjects[q.subject];
      
      // Check if this specific question text already exists to avoid duplicates
      const exists = await Question.findOne({ text: q.text });
      if (!exists) {
        await Question.create({
          text: q.text,
          type: 'mcq', // All seeded questions are MCQs for simplicity
          subjectId: subjObj._id,
          subjectName: subjObj.name,
          semester: subjObj.semester,
          difficulty: q.difficulty,
          marks: q.marks,
          topic: q.topic,
          tags: ['demo-seed', q.subject.toLowerCase()],
          explanation: q.explanation,
          options: q.options,
          correctAnswer: q.correctAnswer, // Exact text match, matching grading.js
          authorId: author._id,
          authorName: author.name,
          isPrivate: false,
          status: 'published', // Required for quizzes to pick them up
          isDeleted: false,
        });
        addedCount++;
      }
    }

    console.log(`✅ Seeded ${addedCount} new Questions (Skipped existing duplicates).`);
    console.log('🚀 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();