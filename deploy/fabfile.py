from __future__ import unicode_literals, absolute_import

from fabric.api import env, run, sudo, settings, cd

REPOSITORY = 'git://github.com/trademapper/trademapper-js.git'
CODE_DIR = '/var/www/wwftrademapper/'

env.hosts = ['lin-one.aptivate.org:48001']


def deploy():
    with settings(warn_only=True):
        if run("test -d %s" % CODE_DIR).failed:
            sudo("git clone %s %s" % (REPOSITORY, CODE_DIR))
    with cd(CODE_DIR):
        sudo("git pull")
