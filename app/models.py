# models.py 

from datetime import datetime 
from time import time
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select, func, Column, extract 
from sqlalchemy.orm import column_property
from sqlalchemy.ext.hybrid import hybrid_property
#from flask_login import UserMixin
#import jwt
from app import app

#@login.user_loader
#def load_user(id):
#    return User.query.get(int(id))

    

@staticmethod
def verify_reset_password_token(token):
    try:
        id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['reset_password']
    except:
        return
    return User.query.get(id)

        

class Member(db.Model):
    __tablename__ = 'tblMember_Data'
    __table_args__ = {"schema": "dbo"}
    id = db.Column(db.Integer, primary_key=True)
    Member_ID = db.Column(db.String(6), index=True, unique=True)
    Last_Name = db.Column(db.String(30))
    First_Name = db.Column(db.String(30))
    #NickName = db.Column(db.String(30))
    Date_Joined = db.Column(db.DateTime)
    #monthJoined = db.Column(db.Integer)
    #yearJoined=db.Column(db.String(4))
    Certified = db.Column(db.Boolean)
    Certification_Training_Date = db.Column(db.DateTime)
    Certified_2 = db.Column(db.Boolean)
    Certification_Training_Date_2 = db.Column(db.DateTime)
    Home_Phone = db.Column(db.String(14))
    Cell_Phone = db.Column(db.String(14))
    #Email = db.Column(db.String(255))
    Dues_Paid=db.Column(db.Boolean)
    NonMember_Volunteer=db.Column(db.Boolean)
    Restricted_From_Shop = db.Column(db.Boolean)
	
    fullName = column_property(First_Name + " " + Last_Name)

    def wholeName(self):
        return self.lastName + ", " + self.firstName 
  
class ShopName(db.Model):
    __tablename__ = 'tblShop_Names'
    __table_args__ = {"schema": "dbo"}
    Shop_Number = db.Column(db.Integer, primary_key=True)
    Shop_Name = db.Column(db.String(30))

class MemberActivity(db.Model):
    __tablename__ = 'tblMember_Activity'
    ID = db.Column(db.Integer, primary_key=True)
    Member_ID = db.Column(db.String(6))
    Check_In_Date_Time = db.Column(db.DateTime)
    Check_Out_Date_Time = db.Column(db.DateTime)
    Type_Of_Work = db.Column(db.String(20))
    Shop_Number = db.Column(db.Integer)
    Door_Used = db.Column(db.String(5))
	
	