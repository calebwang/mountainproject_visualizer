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

def dedupe_ticks(ticks):
  """
  Given a list of ticks, dedupe ticks such that we only get
  one tick per route.
  Prefer ticks by send status, then date
  """  
  send_styles = set(["Onsight", "Flash", "Redpoint", "Send", "Lead", ""])
  sorted_ticks = sorted(
    ticks,
    key=lambda t: "{}|{}|{}".format(
      t.route_id,
      "0" if t.style in send_styles else "1",
      t.date
    )
  )
  results_set= set()  
  results = []
  for tick in ticks:
    if tick.route_id not in results_set:
      results.append(tick)
      results_set.add(tick.route_id)
  return results

@app.route("/pyramid/<user_id>")
def ticks(user_id):
  client = mp.Client()
  user = client.users.get(user_id)
  ticks = dedupe_ticks(user.ticks)  
  data = json.dumps([
    _tick_data(tick) for tick in ticks
  ])
  return render_template("pyramid.html", data=data)
