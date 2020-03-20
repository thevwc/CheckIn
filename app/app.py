# app.py

from app import app, db
from app.models import Member, MemberActivity, ShopName

#@app.context_processor
#def inject_today_date():
#    return {'todays_date': datetime.date.today()}

#@app.shell_context_processor
#def make_shell_context():
#    #db = SQLAlchemy()
#    return {'db': db, 'User': User, 'Person': Person}
