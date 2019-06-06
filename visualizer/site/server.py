from flask import Flask, render_template
import mountainproject as mp

app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
  return "Hello World"

@app.route("/pyramid/<user_id>")
def ticks(user_id):
  client = mp.Client()
  user = client.users.get(user_id)
  return render_template("pyramid.html")
