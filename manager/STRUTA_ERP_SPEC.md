```text
STRUTA ERP SYSTEM PRODUCT SPECIFICATION

1. STRUTA ERP Overview

STRUTA ERP is a funeral home and vendor management system built to help funeral homes, service vendors, and their internal teams manage daily operations from one central dashboard. The system supports staff management, case management, transport coordination, vehicle tracking, family communication, client requests, team tasks, reporting, billing visibility, notifications, and realtime operational updates.

The system is role-based. This means each user only sees the information and actions that match their assigned role. A Manager, who represents the funeral home or vendor owner, has full access to the entire workspace. Staff users such as Secretaries, Drivers, Embalmers, and Coordinators only access the modules connected to their responsibilities. This keeps the system organized, secure, and focused for every user.

2. User Roles and Permissions

Manager / Funeral Home or Vendor Owner

The Manager has unrestricted access to the entire STRUTA ERP workspace. The Manager can invite staff, create cases, assign tasks, view reports, manage vehicles, accept or reject client requests, change the general code, delete cases, view staff dashboards, manage staff records, and control all settings. The Manager has no restrictions because this role owns and administers the funeral home or vendor account.

Secretary

The Secretary can view only assigned cases. The Secretary can update assigned case status, communicate with families, view their own schedule, add case notes, call families, and mark family contact as completed. The Secretary cannot invite staff, view reports, manage vehicles, view client requests, access staff management, see other staff tasks, or view cases that are not assigned to them.

Driver

The Driver can view only assigned transport tasks. The Driver can see pickup locations, pickup times, destinations, assigned vehicles, and transport details connected to the assigned case. The Driver can update transport status, update their assigned vehicle status, receive notifications, and add transport notes. The Driver cannot view cases without transport tasks, invite staff, manage all vehicles, see reports, access client requests, view staff management, view secretary tasks, view embalming tasks, or see other drivers' tasks.

Embalmer

The Embalmer can view only assigned embalming cases. The Embalmer can update embalming status from Pending to In Progress to Completed and add embalming notes. The Embalmer cannot view reports, vehicles, client requests, staff management, transport tasks, secretary tasks, cases without embalming tasks, or tasks assigned to other embalmers.

Coordinator

The Coordinator can view all cases, assign tasks to staff, update progress, communicate with families, mark tasks complete, view incoming client requests, accept or reject requests, and add notes to requests. The Coordinator cannot invite staff, view reports, change the general code, access staff management, view billing, or delete cases.

3. Module 1: Authentication and Invite System

The Manager invite flow allows a funeral home or vendor owner to add staff securely. The Manager enters the staff member's email address, selects the correct staff role, and clicks Generate Invite Link. The system creates a unique invite token that expires in 7 days and generates a staff invite link such as struta.com/signup/staff?token=xyz. The invite uses the current general code password, for example STRUTA2026.

The Manager sends the invite link and general code password to the staff member, for example through WhatsApp. The staff member opens the link, and the email address is automatically filled in. The staff member enters the general code password and clicks Sign In & Join. The system creates the account, links the staff member to the correct funeral home or vendor account, and forces the staff member to change the shared code into a personal password. After that, the staff member signs in normally using their email and personal password.

General Code Settings are available only to the Manager. The Manager can view the current general code, such as STRUTA2026, and can click Change General Code to set a new code. Changing the general code invalidates old invite links but does not affect existing staff accounts.

4. Module 2: Case Management

Case Management is the core STRUTA ERP module. The Manager can create a case with deceased name, age, gender, family contact name, family phone number, family email, date of death, burial date, budget, service type, county, and location. The Manager can view all cases across all statuses, update any case status, delete cases, and export case records to PDF or Excel.

The Secretary can view only cases assigned to them. The Secretary can update status through New, Assigned, In Progress, and Done. The Secretary can add notes, call the family using visible contact information, and mark family contact as completed.

The Driver can view only cases with transport tasks assigned to them. The Driver can see pickup location, pickup time, destination, and transport instructions. The Driver can update transport status from Pending to In Transit to Done and add notes such as Vehicle needs fuel.

The Embalmer can view only cases with embalming tasks assigned to them. The Embalmer can update embalming status from Pending to In Progress to Completed and add notes such as Completed at 2PM.

The Coordinator can view all cases, update case status, assign tasks, mark tasks complete, and communicate with families.

Realtime updates are required. When the Manager creates a case, assigned staff receive instant notifications. When staff update a status, the Manager and Coordinator see the update instantly. Dashboards update automatically without refresh.

5. Module 3: Staff Management

Staff Management is visible only to the Manager. The Manager can see the current staff list, including name, role, email, and active status. Example staff include John Doe as Secretary, Mary Jane as Driver, Peter Kim as Embalmer, and Sarah Wanjiru as Coordinator.

The Manager can click Add Staff Member to open the invite form. The form includes name, email, and role selection. Available staff roles include Secretary, Driver, Embalmer, and Coordinator. After the Manager generates the invite, the system displays the invite link, password, expiry period, and buttons to copy the link, copy the password, or send the invite through WhatsApp.

The Manager can view staff activity such as last login time. Example activity includes John Doe last login 2 hours ago, Mary Jane last login yesterday, and Peter Kim last login 3 days ago. The Manager can remove staff when necessary. No other role can see or use Staff Management.

6. Module 4: Transport and Vehicle Management

The Manager can add vehicles by entering vehicle type, plate number, capacity, color, and status. Vehicle types include Hearse, Van, and Pickup. Vehicle statuses include Available, In Use, and Maintenance. The Manager can assign a vehicle and driver to a case, view all vehicles and statuses, and view vehicle usage reports.

The Driver can view only assigned vehicles and transport tasks. The Driver can update vehicle status through Available, In Use, Done, and Maintenance. The Driver can add notes such as Needs oil change and receives notifications when assigned to transport.

Secretaries, Embalmers, and Coordinators cannot see vehicles and cannot see transport tasks. When a Driver marks a vehicle In Use, the Manager sees it instantly. When the Manager assigns a vehicle, the Driver receives an instant notification.

7. Module 5: Client Requests from Platform

Families and clients can submit requests from the platform. Each request includes family name, contact details, county, budget, service type, and date needed. The Manager can view all incoming requests, accept or reject requests, add a message such as Available on [date], and view request history. When the Manager accepts a request, the system automatically creates a case. When the Manager rejects a request, the family is notified.

The Coordinator can also view incoming requests, accept or reject requests, and add notes. Secretaries, Drivers, and Embalmers cannot see client requests. Families can see request status move from Pending to Accepted to Booked and receive notifications when a request is accepted.

8. Module 6: Team Chat and Messaging

Each case has its own chat thread. Only staff assigned to that case can participate. The Manager and assigned staff can chat in the case thread. Messages appear in realtime. Users can share photos such as a vehicle at a location.

For the John Kamau case, the assigned team may include Secretary John, Driver Mary, and Embalmer Peter. The chat participants are John, Mary, Peter, and the Manager. Only the Manager can directly message any staff member. Staff cannot message each other directly outside case-specific chat.

All roles receive new message alerts, task assignment alerts, and case status change alerts through push and in-app notifications.

9. Module 7: Reports

Reports are Manager-only. The Revenue Dashboard shows total revenue this month, active cases, upcoming funerals in the next 7 days, revenue by service type, and a monthly trend chart. Example values include KES 450,000 revenue this month, 12 active cases, and 8 upcoming funerals.

Staff Performance shows tasks completed per staff member, average response time, cases handled per staff member, and staff activity logs. Vehicle Usage shows vehicles used this month, mileage per vehicle, maintenance alerts, and availability status. Case History shows all past cases with search by name, date, and county, export to PDF or Excel, and date range filtering.

No other role can see reports.

10. Individual Role Dashboards

The Manager Dashboard has full access. It shows the funeral home name, overview metrics, active cases, pending requests, revenue this month, upcoming funerals this week, active staff count, and vehicles available. It shows recent cases such as John Kamau, Mary Wanjiru, Peter Ochieng, and Sarah Njeri. It includes New Case and View All Cases buttons, pending requests with Accept and Reject buttons, staff availability, vehicle availability, reports, Staff Management, General Code, and Billing.

The Secretary Dashboard shows only assigned cases and tasks. It includes calling family, updating notes, confirming burial details, visible contact details, due times, status, Mark Complete, Add Note, schedule summary, recent messages, and View All My Cases. The Secretary cannot see other staff tasks, reports, vehicles, client requests, staff management, or unassigned cases.

The Driver Dashboard shows only transport tasks. It includes pickup location, pickup time, destination, assigned vehicle, task status, Mark In Transit, Mark Complete, Add Note, and View Details. It shows vehicle status, weekly transport task count, and recent notifications. The Driver cannot see cases without transport tasks, secretary tasks, embalming tasks, reports, client requests, staff management, or other drivers' tasks.

The Embalmer Dashboard shows only embalming tasks. It includes case name, deceased details, location, status, notes, Start Embalming, Continue, Mark Complete, and Add Note. It shows weekly embalming tasks and recent notifications. The Embalmer cannot see cases without embalming tasks, transport tasks, secretary tasks, reports, vehicles, client requests, or other embalmers' tasks.

The Coordinator Dashboard shows all cases and allows task assignment. It groups cases by urgency, in progress, and completed. It shows family call, transport, and embalming tasks with statuses. It includes Assign Task, Update Status, View Chat, pending requests with Accept and Reject, staff overview, recent messages, and View Full Schedule. The Coordinator cannot see reports, staff management, general code settings, billing, or delete cases.

11. Realtime Data Flow

When the Manager creates a case, assigned staff get instant notifications. When the Driver marks In Transit, the Manager and Coordinator see it instantly. When the Secretary updates status, the Manager and Coordinator see it instantly. When the Embalmer completes a task, the Manager and Coordinator see it instantly. When the Coordinator assigns a task, staff receive instant notifications. When a family submits a request, the Manager and Coordinator see it instantly. All dashboards update automatically without refresh.

12. Permission Matrix

The Manager can invite staff, create cases, view all cases, update case status, assign tasks, view reports, manage vehicles, accept or reject requests, change the general code, use case-specific chat, and direct message staff.

The Secretary cannot invite staff, create cases, view all cases, assign tasks, view reports, manage vehicles, accept or reject requests, change the general code, or direct message staff. The Secretary can update assigned case status and use case chat only for assigned cases.

The Driver cannot invite staff, create cases, view all cases, assign tasks, view reports, globally manage vehicles, accept or reject requests, change the general code, or direct message staff. The Driver can update transport-only status, manage own assigned vehicle status, and use case chat only for assigned cases.

The Embalmer cannot invite staff, create cases, view all cases, assign tasks, view reports, manage vehicles, accept or reject requests, change the general code, or direct message staff. The Embalmer can update embalming-only status and use case chat only for assigned cases.

The Coordinator cannot invite staff, create cases, view reports, manage vehicles, change the general code, or direct message staff. The Coordinator can view all cases, update case status, assign tasks, accept or reject requests, and use case chat for all cases.

13. Key Benefits

Each staff member sees only their own work, reducing clutter and confusion. The Manager has full control over the funeral home or vendor operation. Role-based access improves security by preventing staff from seeing reports, billing, unrelated cases, or other staff tasks. Realtime updates keep teams aligned without refreshing dashboards. Onboarding is simple because the Manager sends an invite link and code. The system is scalable because the funeral home can add staff as it grows.

14. Final Summary

Can the Manager do everything? Yes. The Manager has full access to all features.

Does each staff member get their own dashboard? Yes. Every staff member sees only assigned tasks.

Can staff see everything? No. Access is role-based and limited.

How does staff join? The Manager sends an invite link, the staff member clicks it, enters the general code, changes password, and joins.

Is it realtime? Yes. All dashboards update automatically.
```
