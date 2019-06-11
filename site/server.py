import calendar
import json

from flask import Flask, render_template
import mountainproject as mp

app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
  return ""

def _tick_data(tick):
  return {
    "date": str(tick.date),
    "name": tick.route.name,
    "route_type": str(tick.route.type),
    "grade": str(tick.route.grade),
    "style": tick.style,
    "url": tick.route.url
  }

@app.route("/pyramid/<user_id>")
def ticks(user_id):
  client = mp.Client()
  user = client.users.get(user_id)
  data = json.dumps([
    _tick_data(tick) for tick in user.ticks   
  ])
  return render_template("pyramid.html", data=data)
