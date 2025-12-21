s/User\.create(\s*$/User.create({/
s/UserId\.generate(),\s*$/id: UserId.generate(),/
s/Email\.create('\([^']*\)'),\s*$/email: Email.create('\1'),/
s/'\([^']*\)',\s*$/name: '\1',/
