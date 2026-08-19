Claude Component Verification Workflow
# ============================================================
# ADAMJUREK.COM - CLAUDE COMPONENT VERIFICATION WORKFLOW
# ============================================================
#
# Goal:
# Use Claude Code to automatically test that components are:
# - correctly added
# - correctly imported
# - correctly referenced
# - correctly rendered
# - correctly interactive
# - correctly used inside the TanStack application
#
# IMPORTANT:
# Automated PASS does not mean VERIFIED.
#
# VERIFIED = automated tests PASS + human approval.
# ============================================================


type Component {
  name: String!
  source: String!
  route: String
  references: [String!]!
  status: ComponentStatus!
  lastVerified: String
  verifiedBy: String
}


enum ComponentStatus {
  NOT_TESTED
  IMPLEMENTED
  AUTOMATED_PASSED
  HUMAN_VERIFICATION_REQUIRED
  VERIFIED
  FAILED
  FIX_REQUIRED
}


type TestResult {
  component: String!
  sourceCheck: Boolean!
  importCheck: Boolean!
  renderCheck: Boolean!
  propsCheck: Boolean!
  interactionCheck: Boolean!
  referenceCheck: Boolean!
  consoleCheck: Boolean!
  networkCheck: Boolean!
  accessibilityCheck: Boolean!
  humanApproval: Boolean!
  status: ComponentStatus!
}


# ============================================================
# CLAUDE AGENT
# ============================================================

agent ComponentTester {

  purpose: """
  Test one or more components inside the real TanStack
  application and verify that they work as implemented
  and referenced.
  """

  rules: [

    """
    Never claim that a component works only because
    TypeScript compiles.
    """,

    """
    Never claim that a component works only because
    a unit test passes.
    """,

    """
    Never mark a component VERIFIED without explicit
    human approval.
    """,

    """
    Test the component inside the running application
    whenever possible.
    """,

    """
    Inspect the component source, props, types and
    real references before testing.
    """,

    """
    If something cannot be automatically verified,
    request human verification.
    """,

    """
    When uncertain, report the uncertainty instead
    of assuming success.
    """
  ]
}


# ============================================================
# COMPONENT TEST COMMAND
# ============================================================

command TestComponent {

  input {
    component: String!
  }

  workflow {

    step "Find component" {
      action: """
      Locate the component source, exports, types,
      styles and related files.
      """
    }

    step "Find references" {
      action: """
      Search the repository for every meaningful usage
      of the component.
      """
    }

    step "Inspect contract" {
      action: """
      Identify expected props, variants, states,
      interactions and accessibility requirements.
      """
    }

    step "Start TanStack" {
      action: """
      Start the development application using the
      project's existing package scripts.
      """
    }

    step "Create test route" {
      action: """
      Create or use a temporary component test route.

      Example:

      /test/components/Button
      """
    }

    step "Render component" {
      checks: [
        "component renders",
        "component has no import errors",
        "component has no runtime errors",
        "required props work",
        "default state works"
      ]
    }

    step "Test variants" {
      action: """
      Test every documented or discoverable variant.
      """
    }

    step "Test states" {
      action: """
      Test relevant default, hover, focus, active,
      disabled, loading and error states.
      """
    }

    step "Test interaction" {
      action: """
      Test clicks, keyboard interaction, form events
      and other component-specific behavior.
      """
    }

    step "Check references" {
      action: """
      Open important real usages of the component and
      verify that the component works in its actual
      context, not only inside the isolated test page.
      """
    }

    step "Check browser" {
      checks: [
        "console errors",
        "failed network requests",
        "runtime exceptions",
        "broken rendering"
      ]
    }

    step "Check accessibility" {
      action: """
      Check obvious accessibility requirements such as
      keyboard operation, labels, roles and focus behavior.
      """
    }

    step "Automated result" {
      rule: """
      If all relevant automated checks pass,
      status becomes AUTOMATED_PASSED.
      """
    }

    step "Human verification" {
      rule: """
      STOP before declaring VERIFIED.
      Ask the human to inspect the running component.
      """
    }

    step "Human approval" {
      input: """
      APPROVE
      or
      describe the problem
      """

      if APPROVE {
        status: VERIFIED
      }

      if problem {
        status: FIX_REQUIRED
      }
    }

    step "Record result" {
      action: """
      Update the component registry with the test result,
      date and human verification status.
      """
    }
  }
}


# ============================================================
# HUMAN-IN-THE-LOOP
# ============================================================

humanVerification Component {

  message: """
  AUTOMATED TESTS PASSED

  Human verification is required.

  Open:
  http://localhost:3000/test/components/{component}

  Verify:

  [ ] Visual appearance
  [ ] Layout and spacing
  [ ] Responsive behavior
  [ ] Hover state
  [ ] Focus state
  [ ] Disabled state
  [ ] Interaction behavior
  [ ] Appearance inside real usage

  Reply:

  APPROVE

  or describe the problem.
  """

  rule: """
  Claude must not mark the component VERIFIED
  until the human explicitly approves it.
  """
}


# ============================================================
# COMPONENT CONTRACT
# ============================================================

contract Component {

  required: [
    "renders",
    "imports correctly",
    "accepts expected props",
    "supports documented variants",
    "supports documented states",
    "works in real references",
    "does not produce relevant console errors",
    "does not produce relevant runtime errors"
  ]

  optional: [
    "keyboard interaction",
    "responsive behavior",
    "accessibility",
    "loading state",
    "error state"
  ]
}


# ============================================================
# EXAMPLE COMPONENT CONTRACT
# ============================================================

contract Button {

  component: "Button"

  variants: [
    "primary",
    "secondary",
    "destructive"
  ]

  states: [
    "default",
    "hover",
    "focus",
    "active",
    "disabled"
  ]

  interactions: [
    "click",
    "keyboard"
  ]

  accessibility: [
    "keyboard accessible",
    "visible focus state",
    "appropriate button semantics"
  ]
}


# ============================================================
# TEST HARNESS
# ============================================================

testHarness ComponentTestHarness {

  route: "/test/components/{component}"

  purpose: """
  Provide a predictable environment where Claude can
  test components consistently.
  """

  sections: [
    "Default",
    "Variants",
    "States",
    "Interactions",
    "Responsive",
    "Accessibility",
    "Console"
  ]
}


# ============================================================
# REAL REFERENCE TESTING
# ============================================================

test References {

  rule: """
  A component must not only work in isolation.

  Claude must inspect important real usages.
  """

  example: """

  Button
    |
    +-- Header
    |
    +-- ContactForm
    |
    +-- Modal
    |
    +-- LandingPage

  """

  checks: [
    "correct import",
    "correct props",
    "correct variant",
    "correct styling",
    "correct responsive behavior",
    "correct interaction"
  ]
}


# ============================================================
# COMPONENT REGISTRY
# ============================================================

registry ComponentRegistry {

  example: """

  {
    "Button": {
      "source": "components/Button.tsx",
      "route": "/test/components/Button",
      "status": "VERIFIED",
      "lastVerified": "2026-08-18",
      "verifiedBy": "human"
    },

    "Card": {
      "source": "components/Card.tsx",
      "route": "/test/components/Card",
      "status": "NOT_TESTED"
    }
  }

  """
}


# ============================================================
# STATUS FLOW
# ============================================================

workflow VerificationStatus {

  NOT_TESTED
    -> IMPLEMENTED

  IMPLEMENTED
    -> AUTOMATED_PASSED

  AUTOMATED_PASSED
    -> HUMAN_VERIFICATION_REQUIRED

  HUMAN_VERIFICATION_REQUIRED
    -> VERIFIED

  HUMAN_VERIFICATION_REQUIRED
    -> FIX_REQUIRED

  FIX_REQUIRED
    -> IMPLEMENTED

  VERIFIED
    -> NOT_TESTED
    """
    If the implementation changes substantially,
    verification should be performed again.
    """
}


# ============================================================
# CLAUDE COMMANDS
# ============================================================

command "/test-component Button" {
  action: TestComponent
}


command "/test-component Card" {
  action: TestComponent
}


command "/test-all-components" {

  workflow: """

  1. Read component registry.
  2. Find components marked NOT_TESTED.
  3. Test each component.
  4. Run automated checks.
  5. Create human verification queue.
  6. Do not mark anything VERIFIED automatically.
  7. Produce final report.
  """
}


command "/verify-site" {

  workflow: """

  1. Build the application.
  2. Start TanStack.
  3. Read component registry.
  4. Find important application routes.
  5. Find component references.
  6. Test components.
  7. Test important page references.
  8. Check browser console.
  9. Check runtime errors.
  10. Check failed network requests.
  11. Check accessibility.
  12. Produce human verification queue.
  13. Wait for human approval.
  """
}


# ============================================================
# TEST REPORT
# ============================================================

report ComponentVerification {

  example: """

  COMPONENT VERIFICATION

  Button
  -------------------------
  Source              PASS
  Import              PASS
  Render              PASS
  Props               PASS
  Variants            PASS
  Interaction         PASS
  References          PASS
  Console             PASS
  Network             PASS
  Accessibility       PASS

  Automated result:   PASS
  Human result:       APPROVED
  Final status:       VERIFIED


  Card
  -------------------------
  Source              PASS
  Import              PASS
  Render              PASS
  Props               PASS
  References          PASS

  Automated result:   PASS
  Human result:       REQUIRED
  Final status:       HUMAN_VERIFICATION_REQUIRED


  Modal
  -------------------------
  Source              PASS
  Import              PASS
  Render              FAIL
  Interaction         FAIL

  Final status:       FIX_REQUIRED
  """
}


# ============================================================
# NON-NEGOTIABLE RULES
# ============================================================

rules FinalRules {

  rule_1: """
  PASS is not VERIFIED.
  """

  rule_2: """
  Human approval is required for VERIFIED.
  """

  rule_3: """
  Test real component usage, not only isolated rendering.
  """

  rule_4: """
  Never hide failures.
  """

  rule_5: """
  Never assume visual correctness.
  """

  rule_6: """
  Never fabricate a successful test.
  """

  rule_7: """
  If a test cannot be performed, say so.
  """

  rule_8: """
  If implementation changes, consider previous
  verification invalid.
  """

  rule_9: """
  Keep evidence for every verification.
  """

  rule_10: """
  The goal is to verify that the component behaves
  the way its implementation and references say it should.
  """
}


# ============================================================
# FINAL WORKFLOW
# ============================================================

workflow AdamJurekComponentVerification {

  input:
    "component name or site"

  execute: [

    "inspect source",

    "inspect references",

    "inspect component contract",

    "start TanStack",

    "create/use test harness",

    "render component",

    "test props",

    "test variants",

    "test states",

    "test interactions",

    "test real references",

    "check console",

    "check network",

    "check accessibility",

    "produce automated result",

    "request human verification",

    "wait for APPROVE or problem",

    "record result",

    "mark VERIFIED only after human approval"
  ]

  finalRule: """
  Claude can prove that automated tests passed.

  Claude cannot independently declare that the component
  is visually and functionally correct for the human user.

  Therefore:

  AUTOMATED_PASSED + HUMAN_APPROVED = VERIFIED
  """
}

Suggested file

Save the whole document as:

CLAUDE_COMPONENT_VERIFICATION.md


Then use it as the single specification for the Claude Code workflow.