# routes.py

from flask import render_template, flash, redirect, session, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member , MemberActivity, NotesToMembers, MonitorSchedule
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update
from sqlalchemy.sql import text as SQLQuery
from sqlalchemy.exc import SQLAlchemyError 
import datetime
from datetime import date
from pytz import timezone

@app.route('/')
@app.route('/index')
@app.route('/index/')
def index():
    shopID = getShopID()
    return render_template("checkin.html",shopID=shopID)

@app.route('/checkIn', methods=["GET","POST"])
def checkIn():
    #print('... begin checkIn routine ...')
    shopID = getShopID()
    if request.method != 'POST':
        return
    #restricted = False
    requestData = request.get_json()
    villageID = requestData.get("memberID")
    location = requestData.get("location")
    if location == 'RA':
        shopNumber = 1
    else:
        if location == 'BW':
            shopNumber = 2
        else:
            shopNumber = 0
    
    # IS MEMBER ALREADY CHECKED IN?
    # Look for current checkin in the table tblMember_Activity
    memberCheckedIn = False 
    typeOfWorkAtCheckIn=""
    todaysDate = date.today()
    # sqlCheckInRecord = "SELECT ID, Member_ID, Check_In_Date_Time, Check_Out_Date_Time, "
    # sqlCheckInRecord += "Type_Of_Work, Shop_Number "
    # sqlCheckInRecord += "FROM tblMember_Activity "
    # sqlCheckInRecord += "WHERE Member_ID = '" + villageID + "' "
    # sqlCheckInRecord += "AND Check_Out_Date_Time Is Null "
    # sqlCheckInRecord += "AND Format(Check_In_Date_Time,'yyyy-MM-dd') = '" + str(todaysDate) + "' "
    #print('todaysDate - ',todaysDate)
    # activity = db.engine.execute(sqlCheckInRecord)
    sp = "EXEC memberCheckInsNotOut '" + villageID + "', '" + str(todaysDate) + "'"
    sql = SQLQuery(sp)
    activity = db.engine.execute(sql)




    #print('display current checkIn records without a checkOut time ...')
    for a in activity:
        recordID = a.ID
        typeOfWorkAtCheckIn = a.Type_Of_Work
        checkInTime = a.Check_In_Date_Time
        checkInLocation = a.Shop_Number
        memberCheckedIn = True
        #print('data in tblMember_Activity table: villageID - ', villageID, ' checkInTime - ',checkInTime)

    #Is member already checked in?
    est = timezone('America/New_York')
    if memberCheckedIn:
        processCheckOut(recordID)

        # WAS MEMBER CHECKED INTO THIS LOCATION?  IF SO, CHECK THEM OUT AND RETURN TO INPUT PROMPT
        if checkInLocation == shopNumber:
            est = timezone('America/New_York')
            member = db.session.query(Member).filter(Member.Member_ID == villageID).first()
            memberName = member.First_Name + " " + member.Last_Name
            response_body = {
                "status": "Check Out",
                "memberName": memberName,
                "checkInTime": checkInTime.strftime('%I:%M %p'),
                "checkOutTime":datetime.datetime.now(est).strftime('%I:%M %p'),
                "typeOfWork": typeOfWorkAtCheckIn,
                "note": ""
            }
            res = make_response(jsonify(response_body),200)
            return (res)

            
    # IF MEMBER WAS CHECKED IN TO ANOTHER LOCATION OR WAS NOT CHECKED IN
    # THEN CONTINUE WITH CHECK IN ROUTINE
    typeOfWorkOverride = requestData.get("typeOfWork")

    
    # Retrieve member name, certifications, restrictions, notes
    sqlSelect = "SELECT Member_ID, First_Name, Last_Name, NonMember_Volunteer, Certified, Certified_2,Default_Type_Of_Work, "
    sqlSelect += "Restricted_From_Shop, Reason_For_Restricted_From_Shop, noteToMember, "
    sqlSelect += "Villages_Waiver_Signed, Temporary_ID_Expiration_Date "
    sqlSelect += "FROM tblMember_Data LEFT JOIN notesToMembers ON tblMember_Data.Member_ID = notesToMembers.memberID "
    sqlSelect += "WHERE tblMember_Data.Member_ID='" + villageID + "'"

    try:
        member = db.engine.execute(sqlSelect)
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        response_body = {
            "status" :"Member Not in database.",
            "note" : "None"
        }
        res = make_response(jsonify(response_body),200)
        return(res)
    
    row = 0
    for m in member:
        row += 1
        villageID = m.Member_ID
        memberName = m.First_Name + " " + m.Last_Name
        typeOfWorkToUse = "General"
        if (m.Default_Type_Of_Work != None and m.Default_Type_Of_Work != ''):
            typeOfWorkToUse = m.Default_Type_Of_Work
        
        if (typeOfWorkOverride != ""):
            typeOfWorkToUse = typeOfWorkOverride

        certified1 = m.Certified
        certified2 = m.Certified_2
        restricted = m.Restricted_From_Shop
        reasonRestricted = m.Reason_For_Restricted_From_Shop
        volunteer = m.NonMember_Volunteer

        # CHECK FOR VILLAGES WAIVER NOT SIGNED
        if (m.Villages_Waiver_Signed != True):
            restricted = True
            reasonRestricted += "\nThe Villages Waiver form has not been signed."
        
        # CHECK FOR EXPIRED TEMPORARY VILLAGE ID
        est = timezone('America/New_York')
        curDateTime = datetime.datetime.now()
        emptyDate = datetime.datetime(1900, 1, 1, 0, 0)
       
        if m.Temporary_ID_Expiration_Date != None \
        and m.Temporary_ID_Expiration_Date != '' \
        and m.Temporary_ID_Expiration_Date != emptyDate:
            if (m.Temporary_ID_Expiration_Date < curDateTime):
                restricted = True
                reasonRestricted = "\nYour Village ID is no longer valid."

    # Were any records found?
    if row == 0:
        response_body = {
        "status" :"Not Found",
        "note" : "None"
        }
        res = make_response(jsonify(response_body),200)
        return(res)
        
    # Member record was found  
    # Is their a note for this member?
    note = db.session.query(NotesToMembers.noteToMember).filter(NotesToMembers.memberID == villageID).first()
    if note == None:
        note="None"
        
    # Is member restricted?
    if restricted:
        response_body = {
            "status": "Restricted",
            "memberName": memberName,
            "reason": reasonRestricted,
            "note": note
        }
        res = make_response(jsonify(response_body),200) 
        return(res)

    # Is member certified?
    if shopNumber == 1 and not certified1 and not volunteer:
        response_body = {
        "status" :"Not Certified",
        "msg": "Not certified for ROLLING ACRES",
        "note":note
        }
        res = make_response(jsonify(response_body),200)
        return(res)
           
    if shopNumber == 2 and not certified2 and not volunteer:
        response_body = {
        "status" :"Not Certified",
        "msg": "Not certified for BROWNWOOD",
        "note": note
        }
        res = make_response(jsonify(response_body),200)
        return(res)
    
    # MEMBER, OR VOLUNTEER, IS NOT RESTRICTED
    # AND THEY ARE NOT ALREADY CHECKED IN TO EITHER LOCATION,
    # SO THEY MAY BE CHECKED IN

    
    # if not restricted:
    #     # Retrieve today's check in record, if any, for this member
    #     todaysDate = date.today()
        
    #     sqlCheckInRecord = "SELECT ID, Member_ID, Check_In_Date_Time, Check_Out_Date_Time, "
    #     sqlCheckInRecord += "Type_Of_Work, Shop_Number "
    #     sqlCheckInRecord += "FROM tblMember_Activity "
    #     sqlCheckInRecord += "WHERE Member_ID = '" + villageID + "' "
    #     sqlCheckInRecord += "AND Check_Out_Date_Time Is Null "
    #     sqlCheckInRecord += "AND Format(Check_In_Date_Time,'yyyy-MM-dd') = '" + str(todaysDate) + "' "
    #     #sqlCheckInRecord += "AND Shop_Number = '" + str(shopNumber) + "'"
       
    #    # Look for current checkin in the table tblMember_Activity
    #     memberCheckedIn = False 
    #     typeOfWorkAtCheckIn=""
    #     activity = db.engine.execute(sqlCheckInRecord)
    #     for a in activity:
    #         recordID = a.ID
    #         typeOfWorkAtCheckIn = a.Type_Of_Work
    #         checkInTime = a.Check_In_Date_Time
    #         checkInLocation = a.Shop_Number
    #         memberCheckedIn = True

    #     #Is member checked in?
    #     est = timezone('America/New_York')
    #     if not memberCheckedIn:
    processCheckIn(villageID,typeOfWorkToUse,shopNumber)
    response_body = {
        "status": "Check In",
        "memberName": memberName,
        "checkInTime":datetime.datetime.now(est).strftime('%I:%M %p'),
        "typeOfWork": typeOfWorkToUse,
        "note": note
    }
    res = make_response(jsonify(response_body),200)
    return(res)
        # else:
                
        #     processCheckOut(recordID)
        #     est = timezone('America/New_York')
        #     response_body = {
        #         "status": "Check Out",
        #         "memberName": memberName,
        #         "checkInTime": checkInTime.strftime('%I:%M %p'),
        #         "checkOutTime":datetime.datetime.now(est).strftime('%I:%M %p'),
        #         "typeOfWork": typeOfWorkAtCheckIn,
        #         "note": note
        #     }
        #     res = make_response(jsonify(response_body),200)

        #     # WAS MEMBER CHECKED INTO ANOTHER LOCATION, IF SO CHECK THEM IN TO THIS LOCATION?
        #     if checkInLocation != shopNumber :
        #         processCheckIn(villageID,typeOfWorkToUse,shopNumber)
        #         response_body = {
        #             "status": "Check In",
        #             "memberName": memberName,
        #             "checkInTime":datetime.datetime.now(est).strftime('%I:%M %p'),
        #             "typeOfWork": typeOfWorkToUse,
        #             "note": note
        #         }
        #         res = make_response(jsonify(response_body),200)
        #     return(res)

    # If no condition is met return the following -
    # response_body = {
    #     "status" :"Error",
    #     "note": note
    # }
    # res = make_response(jsonify(response_body),200)
    # return(res)

def processCheckIn(villageID,typeOfWork,shopNumber):
    est = timezone('America/New_York')
    checkInDateTime = datetime.datetime.now(est)
   
    # Is the member on monitor duty today?
    todaySTR = checkInDateTime.strftime('%Y-%m-%d')  
    currentHour = datetime.datetime.now(est).hour
    
    if currentHour < 11:
        # Check for AM monitor
        assignedAMshift = db.session.query(MonitorSchedule)\
            .filter(MonitorSchedule.Member_ID == villageID)\
            .filter(MonitorSchedule.AM_PM == 'AM')\
            .filter(MonitorSchedule.Date_Scheduled == todaySTR).first()
        if assignedAMshift != None:
            typeOfWork = 'Monitor'
    else:
        # Check for PM monitor
        assignedPMshift = db.session.query(MonitorSchedule)\
        .filter(MonitorSchedule.Member_ID == villageID)\
        .filter(MonitorSchedule.AM_PM == 'PM')\
        .filter(MonitorSchedule.Date_Scheduled == todaySTR).first()
        if assignedPMshift != None:
              typeOfWork = 'Monitor'
   
    try:
        activity = MemberActivity(Member_ID=villageID,Check_In_Date_Time=checkInDateTime,Type_Of_Work=typeOfWork,Shop_Number=int(shopNumber),Door_Used='Front')
        db.session.add(activity)
        db.session.commit()
        return() 
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        db.session.rollback()
        return 

    return

def processCheckOut(recordID):
    est = timezone('America/New_York')
    checkOutDateTime = datetime.datetime.now(est)
    try:
        activity = db.session.query(MemberActivity).filter(MemberActivity.ID == recordID).one()
        activity.Check_Out_Date_Time = checkOutDateTime
        db.session.commit()
        return
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        db.session.rollback()
        flash("Check out could not be completed.\n"+error,"danger")
        return

@app.route("/deleteNote", methods=["GET","POST"])
def deleteNote():
    if request.method != 'POST':
        return
    requestData = request.get_json()
    villageID = requestData.get("memberID")
    note = db.session.query(NotesToMembers).filter(NotesToMembers.memberID == villageID).one()
    if note:
        try:
            db.session.delete(note)
            db.session.commit()
            response_body = {
                "status" :"Success"
            }
            res = make_response(jsonify(response_body),200)
            return(res)
        except SQLAlchemyError as e:
            db.session.rollback()
            response_body = {
                "status" :"Error - note could not be deleted."
            }
            res = make_response(jsonify(response_body),200)
            return(res)
    else:
        response_body = {
            "status" :"No note to delete."
            }
        res = make_response(jsonify(response_body),200)
        return(res)    

def getShopID():
    if 'shopID' in session:
        shopID = session['shopID']
    else:
        shopID = 'RA'
    return shopID