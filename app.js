// ===========================
// CONFIGURATION
// ===========================

// Judge0 via RapidAPI (free account required)
const JUDGE0_URL =
  "https://judge0-extra.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

const API_KEY = "7205be897fmsh71d4376a5af3dc8p1ce41ejsn88299e69f7cb"; // <-- Replace this

// Instructor JUnit tests — you can add multiple assignments!
const assignmentTests = {
 "hello-test": `
import static org.junit.Assert.*;
import org.junit.Test;

public class HelloTest {

    @Test
    public void testGreet() {
        Hello h = new Hello();
        assertEquals("Hello, Bob", h.greet("Bob"));
    }

    @Test
    public void testAdd() {
        Hello h = new Hello();
        assertEquals(7, h.add(3, 4));
    }
}
`

};

// Mapping assignment → test class to run
const testClassName = {
  "hello-test": "HelloTest"
};

// ===========================
// DOM ELEMENTS
// ===========================

const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("javaFile");
const assignmentSelect = document.getElementById("assignmentId");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const submitBtn = document.getElementById("submitBtn");

// ===========================
// HELPER FUNCTIONS
// ===========================

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setResults(msg) {
  resultsEl.textContent = msg;
}

// Read student .java file
function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(file);
  });
}

// ===========================
// MAIN SUBMISSION HANDLER
// ===========================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const assignmentId = assignmentSelect.value;

  if (!file) {
    setStatus("Please choose a .java file first.");
    return;
  }

  const studentCode = await readFileAsText(file);
  const testCode = assignmentTests[assignmentId];
  const testClass = testClassName[assignmentId];

  if (!testCode) {
    setStatus("Error: No tests found for this assignment.");
    return;
  }

  setStatus("Submitting to Judge0…");
  submitBtn.disabled = true;
  setResults("Running JUnit tests…");

  // Prepare Judge0 submission
  const payload = {
    language_id: 62, // Java 17
    files: [
      { name: file.name, content: studentCode },
      { name: `${testClass}.java`, content: testCode }
    ],
    compile_command: "javac -cp .:/usr/share/java/junit4.jar *.java",
    run_command: `java -cp .:/usr/share/java/junit4.jar org.junit.runner.JUnitCore ${testClass}`
  };

  try {
    const response = await fetch(JUDGE0_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": "judge0-extra.p.rapidapi.com"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    const out =
      data.stdout ||
      data.stderr ||
      data.compile_output ||
      "No output received.";

    setResults(out);
    setStatus("Finished!");
  } catch (err) {
    console.error(err);
    setStatus("Network error contacting Judge0.");
    setResults(String(err));
  } finally {
    submitBtn.disabled = false;
  }
});
