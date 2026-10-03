# Talabon People Operations

The system of record for everyone who works for Talabon: who they are, the terms they work under, what happens to them during their working life, and what they get paid.

Talabon is a printing and logistics business, but this context covers only the people side of it.
Customers, enquiries, quotes, pricing, deliveries and invoices are not modelled here.
A Print Job appears only in the stripped-down form needed to check what people claim they produced.

## Language

### People and terms

**Person**:
A single human being Talabon holds records for, whether or not they currently work here.
Name, phone, photo, bank account, next of kin, guarantor and any outstanding Loan belong to the Person and survive every change in how they work for Talabon.
Talabon deliberately does not hold NINs.
_Avoid_: Employee, Staff, Worker, User

**Engagement**:
One continuous period during which a Person works for Talabon under one set of terms.
A Person accumulates many Engagements over time but has at most one active at a time, so job title, pay basis, reporting line and issued Documents all belong to the Engagement rather than the Person.
_Avoid_: Employment, Contract, Job, Position

**Permanent Engagement**:
An Engagement on a monthly salary, carrying the full Document set, a Leave entitlement, a Performance Review cycle and eligibility for a Loan.
Its pay is computed by the system rather than observed by it.
_Avoid_: Full-time, Staff, Confirmed

**Casual Engagement**:
An Engagement paid for work completed rather than time served, with no salary, no Leave entitlement and no Performance Review cycle.
Its pay is observed by the system rather than computed by it, and comes entirely from completed Tasks.
Defined here because casual workers exist at Talabon, but deferred past the MVP by [ADR 0010](./docs/adr/0010-the-mvp-covers-permanent-engagements-only.md), which builds Permanent Engagements only.
_Avoid_: Temp, Contract worker, Ad-hoc, Daily paid

**Grade**:
A rung on Talabon's seniority ladder fixing the salary band an Engagement sits in, the amount deducted per Missed Day, and the Premium earned per non-Expected Day worked.
Leave entitlement and Loan ceiling are set per Engagement rather than by Grade.
_Avoid_: Level, Band, Rank, Tier

**Manager**:
The Person an Engagement reports to, who approves its Leave, verifies its Output Logs and confirms its Tasks.
A Manager's authority covers a person's time and work but never their pay.
_Avoid_: Supervisor, Line manager, Boss, Head

**Approving Role**:
A named position, such as HR, Finance or MD, holding authority over money regardless of who reports to whom.
Loans, Grade and salary changes, promotions and Payroll Run approval belong here rather than to the reporting line.
_Avoid_: Permission, Admin, Authoriser

### Events and documents

**Employment Event**:
A recorded fact that changes an Engagement's terms or standing, such as a promotion, a sanction, a confirmation or an exit.
The event is the source of truth and any letter is rendered from it, so a promotion changes what payroll pays whether or not a letter is ever printed.
_Avoid_: Action, Change, Update, Transaction

**Template**:
A versioned letter or form Talabon issues, with placeholders for Person, Engagement and Employment Event data.
Every Document records the Template version it came from, so a letter issued years ago still reproduces exactly after the wording changes.
_Avoid_: Form, Boilerplate, Doc type

**Document**:
An artifact generated for or collected from a Person, such as an offer letter, a disciplinary letter or a guarantor form.
It is Issued when generated and only Signed once the wet-signed scan is attached, so an unsigned NDA is visibly outstanding rather than silently missing.
_Avoid_: Letter, File, Paperwork, Attachment

**Policy**:
A versioned rule or procedure Talabon publishes to a group of people rather than issuing to one, covering both the staff policy and the SOP for a particular operation.
It is read by many and wet-signed by nobody, so where proof of reading is needed a separate Document is issued from it and signed in the ordinary way.
_Avoid_: Procedure, Manual, Handbook, Guideline, Rule

**Job Description**:
The versioned statement of what a job title is responsible for, shown on every Engagement holding that title.
It describes the job rather than the person, so it changes when the role changes and not when the holder does.
_Avoid_: JD, Role, Spec, Duties

**Performance Review**:
A twice-yearly assessment of a Permanent Engagement, pre-filled with the period's Attendance, Tasks and Output Logs alongside the Manager's written assessment.
It produces a recommendation only, so any resulting pay change is a separate Employment Event approved by an Approving Role.
_Avoid_: Appraisal, Evaluation, Check-in, Assessment

**Report**:
A weekly or monthly submission by a Person, pre-filled with their Attendance, Tasks and Output Logs for the period.
The Person supplies only the narrative the data cannot carry, such as problems hit and help needed.
_Avoid_: Update, Timesheet, Return, Summary

### Time

**Expected Day**:
A day an Engagement is required to work: Monday to Saturday, excluding Nigerian public holidays.
The Expected Day calendar exists to decide deductions, so an error in it takes money off someone for a day they were never meant to work.
_Avoid_: Working day, Business day, Weekday

**Operating Day**:
A day Talabon runs production, which can be any day including Sundays and public holidays.
Operating Days say when work is possible, never when attendance is required, so the two calendars must not be collapsed into one.
_Avoid_: Open day, Production day, Shift day

**Attendance**:
The mark recording whether a Person on a Permanent Engagement was present on a given Expected Day.
Every Expected Day is marked, so an unmarked day is a gap to chase rather than an assumed day of presence.
_Avoid_: Timesheet, Clock-in, Register

**Missed Day**:
An Expected Day on which a Person was absent without approved Leave.
Each one costs the Grade's fixed daily deduction.
_Avoid_: Absence, Absenteeism, Sick day, No-show

**Leave**:
Approved paid absence drawn from an Engagement's annual entitlement.
Once the entitlement is exhausted, further approved absence is unpaid and becomes a Missed Day, so approval and payment are separate questions.
_Avoid_: Holiday, Time off, PTO, Vacation

### Work and output

**Task**:
A discrete unit of work assigned to a Person at an amount agreed before the work starts, then confirmed complete by the Manager who assigned it.
Completed Tasks are the sole input to Casual Engagement pay, which makes a Task a payment record rather than a to-do item.
_Avoid_: Job, Ticket, Assignment, To-do

**Print Job**:
A piece of production work identified by a job number, carrying what is printed, the quantity ordered, the size and type, and when it is due.
It exists solely to give Output Logs something to be checked against, so it holds nothing commercial: no customer, no price, no quote, no invoice.
_Avoid_: Order, Job card, Work order, Project

**Output Log**:
An operator's claim of how much of a Print Job they produced, verified by their Manager before it counts toward anything.
Logged output across a Print Job cannot exceed the quantity ordered plus a spoilage margin, which is what makes the claim falsifiable.
_Avoid_: Production record, Tally, Count, Throughput

### Pay

**Payroll Run**:
One execution of pay calculation covering a set of Engagements for one period, ending in an approved Payment Schedule.
A Run is immutable once approved, so a correction is a later Run rather than an edit to an earlier one.
_Avoid_: Pay cycle, Payroll, Salary run

**Pay Addition**:
An amount added to what an Engagement is owed in a Payroll Run, currently either an Output Bonus or a Premium.
Additions and Deductions are deliberately symmetric so every movement away from base salary is itemised on the payslip.
_Avoid_: Allowance, Extra, Uplift, Top-up

**Output Bonus**:
A Pay Addition earned by verified Output Log volume above a published threshold.
It comes from a formula rather than a manager's discretion, so it can be argued against the record.
_Avoid_: Incentive, Reward, Commission, Performance pay

**Premium**:
A Pay Addition earned for working an Operating Day that is not an Expected Day, at a flat amount fixed by Grade.
It is the exact mirror of a Missed Day deduction, using the same per-Grade daily figure.
_Avoid_: Overtime, Holiday pay, Penalty rate, Extra duty

**Deduction**:
An amount subtracted from what an Engagement is owed in a Payroll Run, such as a Loan repayment, a Missed Day or a disciplinary sanction.
Talabon withholds nothing statutory, so every Deduction traces to a specific Talabon decision.
_Avoid_: Withholding, Stoppage, Charge, Tax

**Net Pay**:
What an Engagement is owed after Pay Additions and Deductions, and the exact amount that reaches the Person's bank account.
Nothing is subtracted downstream, so Net Pay is final rather than indicative.
_Avoid_: Take-home, Salary, Gross

**Payment Schedule**:
The approved list of people and Net Pay amounts for one Payroll Run, handed to a human to execute at the bank.
The system produces and records it but never moves money itself.
_Avoid_: Payment file, Bank upload, Disbursement

**Payment**:
A record that money was given to a Person, with the Tasks it settles attached.
It is written after the money has already changed hands, so it is evidence rather than an instruction.
_Avoid_: Transaction, Payout, Disbursement, Settlement

**Loan**:
Money advanced to a Permanent Engagement, capped at a multiple of monthly salary and recovered through Deductions in later Payroll Runs.
The outstanding balance belongs to the Person rather than the Engagement, so it survives their departure and follows them into any later Engagement.
_Avoid_: Advance, Credit, Salary advance, IOU
